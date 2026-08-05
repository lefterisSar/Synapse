package org.Synapse.web;

import org.Synapse.meta.MarketingService;
import org.Synapse.meta.dto.Campaign;
import org.Synapse.meta.dto.Insight;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Read-only REST API the frontend dashboard consumes. */
@RestController
@RequestMapping("/api")
public class DashboardController {

    private final MarketingService marketing;

    public DashboardController(MarketingService marketing) {
        this.marketing = marketing;
    }

    /** Cheap check the frontend (or a curl) can hit to confirm credentials are wired up. */
    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("configured", marketing.isConfigured());
    }

    @GetMapping("/campaigns")
    public List<Campaign> campaigns() {
        return marketing.campaigns();
    }

    @GetMapping("/insights")
    public Insight accountInsights(@RequestParam(defaultValue = "last_30d") String datePreset) {
        return marketing.accountInsights(datePreset);
    }

    @GetMapping("/insights/by-campaign")
    public List<Insight> insightsByCampaign(@RequestParam(defaultValue = "last_30d") String datePreset) {
        return marketing.insightsByCampaign(datePreset);
    }
}
