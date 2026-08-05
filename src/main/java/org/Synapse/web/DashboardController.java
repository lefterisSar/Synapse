package org.Synapse.web;

import org.Synapse.meta.MarketingService;
import org.Synapse.meta.dto.Account;
import org.Synapse.meta.dto.Ad;
import org.Synapse.meta.dto.AdPreviewResult;
import org.Synapse.meta.dto.Campaign;
import org.Synapse.meta.dto.Insight;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
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

    @GetMapping("/account")
    public Account account() {
        return marketing.account();
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

    @GetMapping("/campaigns/{campaignId}/ads")
    public List<Ad> ads(@PathVariable String campaignId) {
        return marketing.adsForCampaign(campaignId);
    }

    @GetMapping("/ads/{adId}/preview")
    public AdPreviewResult adPreview(
            @PathVariable String adId,
            @RequestParam(defaultValue = "DESKTOP_FEED_STANDARD") String adFormat) {
        return marketing.adPreview(adId, adFormat);
    }

    /** Proxies the ad's creative thumbnail so the browser loads it same-origin (no fbcdn/ad-blocker). */
    @GetMapping("/ads/{adId}/thumbnail")
    public ResponseEntity<byte[]> thumbnail(@PathVariable String adId) {
        byte[] bytes = marketing.adThumbnail(adId);
        if (bytes == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(30)))
                .body(bytes);
    }
}
