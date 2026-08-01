package com.greenops.agent;

import com.greenops.agent.application.service.DriverImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DriverImportRunner implements CommandLineRunner {

    private final DriverImportService driverImportService;

    @Override
    public void run(String... args) {
        String filePath = null;
        String companyCode = null;

        for (String arg : args) {
            if (arg.startsWith("--import-file=")) {
                filePath = arg.substring("--import-file=".length());
            } else if (arg.startsWith("--company=")) {
                companyCode = arg.substring("--company=".length());
            }
        }

        if (filePath == null) {
            return;
        }

        if (companyCode == null) {
            companyCode = "TYMUI";
        }

        log.info("Starting driver import from: {} for company: {}", filePath, companyCode);

        try {
            DriverImportService.ImportResult result = driverImportService.importDrivers(companyCode, filePath);
            log.info("=== Import completed ===");
            log.info("Total rows: {}", result.getTotalRows());
            log.info("Updated/Created: {}", result.getUpdatedRows());
            log.info("Drivers created: {}", result.getDriversCreated());
            log.info("Errors: {}", result.getErrorRows());
            if (!result.getErrors().isEmpty()) {
                result.getErrors().forEach(e -> log.error("  - {}", e));
            }
        } catch (Exception e) {
            log.error("Import failed: {}", e.getMessage(), e);
        }

        System.exit(0);
    }
}
