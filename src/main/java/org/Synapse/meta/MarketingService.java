package org.Synapse.meta;

import org.Synapse.config.MetaProperties;
import org.Synapse.meta.dto.Campaign;
import org.Synapse.meta.dto.Insight;
import org.springframework.stereotype.Service;

import java.util.List;

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
}
