# External APIs

Based on the Smart Support Agent Application requirements and the local-first architecture, there is only one external integration:

## Domo LLM API
- **Purpose:** Enhance case data and generate Hivemind reports through AI assistance
- **Documentation:** Manual interaction with Domo's LLM chat interface
- **Base URL(s):** N/A - Manual copy/paste workflow
- **Authentication:** User's existing Domo session/credentials
- **Rate Limits:** Subject to user's Domo subscription limits

**Key Endpoints Used:**
- N/A - Manual copy/paste workflow with structured prompts

**Integration Notes:** 
The application generates structured prompts that users copy to Domo's LLM interface. The application stores reference numbers as simple text fields that can be formatted into URLs:
- Salesforce Case Numbers: Stored as 8-digit format (e.g., "05907169")
- JIRA Hivemind Tickets: Stored as "HIVE-2263", displayed as https://onjira.domo.com/browse/HIVE-2263
- JIRA Engineering Tickets: Stored as "DOMO-456837", displayed as https://onjira.domo.com/browse/DOMO-456837