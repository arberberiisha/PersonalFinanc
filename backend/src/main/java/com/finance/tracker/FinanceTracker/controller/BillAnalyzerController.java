package com.finance.tracker.FinanceTracker.controller;

import com.finance.tracker.FinanceTracker.service.BillService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BillAnalyzerController {

    private final BillService billService;
    private static final Logger logger = LoggerFactory.getLogger(BillAnalyzerController.class);

    public BillAnalyzerController(BillService billService) {
        this.billService = billService;
    }

    @PostMapping("/analyze-bill")
    public ResponseEntity<?> analyzeBill(@RequestParam("bill") MultipartFile file) {
        try {
            logger.info("Received bill image for analysis");
            byte[] bytes = file.getBytes();
            String result = billService.analyzeBill(bytes);
            logger.info("Bill analysis completed");
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            logger.error("Error reading uploaded file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to read image.");
        } catch (Exception e) {
            logger.error("Error processing request to OpenAI API", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("GPT processing failed: " + e.getMessage());
        }
    }
}
