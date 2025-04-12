package com.finance.tracker.FinanceTracker.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import java.util.Base64;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BillAnalyzerController {

    private static final Logger logger = LoggerFactory.getLogger(BillAnalyzerController.class);

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @PostMapping("/analyze-bill")
    public ResponseEntity<?> analyzeBill(@RequestParam("bill") MultipartFile file) {
        try {
            logger.info("Received bill image for analysis");
            byte[] bytes = file.getBytes();
            String base64Image = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes);

            logger.debug("Encoded image to base64");

            Map<String, Object> imageMap = new HashMap<>();
            imageMap.put("type", "image_url");
            Map<String, String> imageUrlMap = new HashMap<>();
            imageUrlMap.put("url", base64Image);
            imageMap.put("image_url", imageUrlMap);

            Map<String, Object> textMap = new HashMap<>();
            textMap.put("type", "text");
            textMap.put("text", "You're a financial assistant. Look at this bill image and extract the total amount and company or billing name. Respond only in this JSON format: { \"category\": \"KESCO\", \"actual\": \"52.21\" }. If company name is missing, set category as 'Bill'.");

            Map<String, Object> messageContent = new HashMap<>();
            messageContent.put("role", "user");
            messageContent.put("content", new Object[]{textMap, imageMap});

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o");
            requestBody.put("messages", new Object[]{messageContent});
            requestBody.put("max_tokens", 300);

            ObjectMapper mapper = new ObjectMapper();
            String payload = mapper.writeValueAsString(requestBody);
            logger.debug("Prepared request payload: {}", payload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            HttpEntity<String> request = new HttpEntity<>(payload, headers);
            RestTemplate restTemplate = new RestTemplate();

            logger.info("Sending request to OpenAI API");
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api.openai.com/v1/chat/completions",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            logger.info("Received response from OpenAI API");
            Map<String, Object> choices = ((Map<String, Object>) ((java.util.List<?>) response.getBody().get("choices")).get(0));
            String content = (String) ((Map<String, Object>) choices.get("message")).get("content");

            content = content.trim();
            if (content.startsWith("```json")) {
                content = content.substring(7).replace("```", "").trim();
            }

            logger.debug("Extracted content from response: {}", content);
            return ResponseEntity.ok(content);

        } catch (IOException e) {
            logger.error("Error reading uploaded file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to read image.");
        } catch (Exception e) {
            logger.error("Error processing request to OpenAI API", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("GPT processing failed: " + e.getMessage());
        }
    }
}
