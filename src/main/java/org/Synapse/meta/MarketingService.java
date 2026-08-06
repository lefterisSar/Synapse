package org.Synapse.meta;

import org.Synapse.config.MetaProperties;
import org.Synapse.meta.dto.Account;
import org.Synapse.meta.dto.Ad;
import org.Synapse.meta.dto.AdPreviewResult;
import org.Synapse.meta.dto.Campaign;
import org.Synapse.meta.dto.Insight;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Application-facing view over {@link MetaMarketingClient}: unwraps the Graph API envelope
 * and applies small conveniences (default date preset, single-row account insight).
 */
@Service
public class MarketingService {

    private final MetaMarketingClient client;
    private final MetaProperties props;

    public MarketingService(MetaMarketingClient client, MetaProperties props) {
        this.client = client;
        this.props = props;
    }

    public boolean isConfigured() {
        return props.isConfigured();
    }

    public Account account() {
        return client.getAccount();
    }

    public List<Campaign> campaigns() {
        return client.getCampaigns().data();
    }

    /** The single aggregate row for the account, or null if Meta returns no data for the window. */
    public Insight accountInsights(String datePreset) {
        List<Insight> rows = client.getAccountInsights(datePreset).data();
        return rows == null || rows.isEmpty() ? null : rows.getFirst();
    }

    public List<Insight> insightsByCampaign(String datePreset) {
        return client.getInsightsByCampaign(datePreset).data();
    }

    // --- ads & previews ---------------------------------------------------

    /** Meta object ids are numeric; reject anything else before it reaches the Graph API path. */
    private static final Pattern NUMERIC_ID = Pattern.compile("\\d{1,30}");

    /** Ad-preview formats we expose. Restricting the set stops arbitrary query injection. */
    private static final Set<String> AD_FORMATS = Set.of(
            "DESKTOP_FEED_STANDARD",
            "MOBILE_FEED_STANDARD",
            "INSTAGRAM_STANDARD",
            "INSTAGRAM_STORY",
            "FACEBOOK_STORY_MOBILE",
            "RIGHT_COLUMN_STANDARD"
    );

    public List<Ad> adsForCampaign(String campaignId) {
        requireNumericId(campaignId, "campaignId");
        return client.getAdsForCampaign(campaignId).data();
    }

    public AdPreviewResult adPreview(String adId, String adFormat) {
        requireNumericId(adId, "adId");
        if (!AD_FORMATS.contains(adFormat)) {
            throw new IllegalArgumentException("Unsupported adFormat: " + adFormat);
        }
        return new AdPreviewResult(adFormat, client.getAdPreview(adId, adFormat));
    }

    /** Proxied ad image bytes (full_picture when available, else thumbnail), or null if none. */
    public byte[] adThumbnail(String adId) {
        requireNumericId(adId, "adId");
        String url = client.getAdImageUrl(adId);
        if (url == null || url.isBlank()) {
            return null;
        }
        return client.fetchImage(url);
    }

    private static void requireNumericId(String id, String name) {
        if (id == null || !NUMERIC_ID.matcher(id).matches()) {
            throw new IllegalArgumentException("Invalid " + name + ": must be a numeric Meta id");
        }
    }
}
