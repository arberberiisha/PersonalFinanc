package com.finance.tracker.FinanceTracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class BillService {

    private static final Logger logger = LoggerFactory.getLogger(BillService.class);

    @Value("${openai.api.key}")
    private String openaiApiKey;

    public String analyzeBill(byte[] imageBytes) throws Exception {
        logger.info("Starting bill analysis...");

        String base64Image = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(imageBytes);
        logger.debug("Encoded image to base64");

        // Prepare image part of the message
        Map<String, Object> imageMap = new HashMap<>();
        imageMap.put("type", "image_url");
        imageMap.put("image_url", Collections.singletonMap("url", base64Image));

        // Prepare text instruction for GPT
        Map<String, Object> textMap = new HashMap<>();
        textMap.put("type", "text");
        textMap.put("text", "You're a financial assistant. Look at this bill image and extract the total amount and company or billing name. Respond only in this JSON format: { \"category\": \"KESCO\", \"actual\": \"52.21\" }. If company name is missing, set category as 'Bill'.");

        // Create message content
        Map<String, Object> messageContent = new HashMap<>();
        messageContent.put("role", "user");
        messageContent.put("content", new Object[]{textMap, imageMap});

        // Final GPT request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4o");
        requestBody.put("messages", new Object[]{messageContent});
        requestBody.put("max_tokens", 300);

        ObjectMapper mapper = new ObjectMapper();
        String payload = mapper.writeValueAsString(requestBody);
        logger.debug("Prepared request payload for OpenAI");

        // Set up headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        HttpEntity<String> request = new HttpEntity<>(payload, headers);
        RestTemplate restTemplate = new RestTemplate();

        logger.info("Sending request to OpenAI...");
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.openai.com/v1/chat/completions",
                HttpMethod.POST,
                request,
                Map.class
        );
        logger.info("Received response from OpenAI");

        // Extract response
        Map<String, Object> choices = (Map<String, Object>) ((List<?>) response.getBody().get("choices")).get(0);
        String content = (String) ((Map<String, Object>) choices.get("message")).get("content");

        content = content.trim();
        if (content.startsWith("```json")) {
            content = content.substring(7).replace("```", "").trim();
        }

        logger.debug("Extracted response content: {}", content);

        // Estimate cost
        double estimatedCost = estimateRequestCost("gpt-4o", 1, 50, 100);
        logger.info("Estimated OpenAI API cost for this request: ${}", String.format("%.5f", estimatedCost));

        logger.info("Bill analysis completed.");
        return content;
    }

    public double estimateRequestCost(String model, int imageCount, int promptTokens, int responseTokens) {
        logger.debug("Calculating cost estimate for model={}, imageCount={}, promptTokens={}, responseTokens={}",
                model, imageCount, promptTokens, responseTokens);

        double imageCost;
        double inputCostPer1k;
        double outputCostPer1k;

        switch (model) {
            case "gpt-4o":
                imageCost = 0.01 * imageCount;
                inputCostPer1k = 0.005;
                outputCostPer1k = 0.015;
                break;
            default:
                imageCost = 0.01;
                inputCostPer1k = 0.01;
                outputCostPer1k = 0.03;
                break;
        }

        double promptCost = (promptTokens / 1000.0) * inputCostPer1k;
        double responseCost = (responseTokens / 1000.0) * outputCostPer1k;
        double totalCost = imageCost + promptCost + responseCost;

        logger.debug("Cost breakdown — Image: {}, Prompt: {}, Response: {}, Total: {}", imageCost, promptCost, responseCost, totalCost);
        return totalCost;
    }
}