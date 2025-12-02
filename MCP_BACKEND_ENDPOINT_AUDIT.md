# MCP Server ↔ Backend Endpoint Audit

**Status**: ⚠️ Critical mismatches found  
**Date**: December 3, 2025

## Summary

**MCP Server** (`mcp-server-python/server_unified.py`): **56 tools** defined  
**Backend Controllers**: Multiple endpoints across different controllers  
**Gemini Service** (`server/src/chatbot/gemini.service.ts`): **54 tools** defined

---

## ✅ Correctly Mapped Tools (48 tools)

### Contacts (6) ✅
| Tool | MCP Endpoint | Backend Controller | Status |
|------|--------------|-------------------|--------|
| `contacts_list` | `GET /contacts` | `ContactsController @Get()` | ✅ |
| `contacts_create` | `POST /contacts` | `ContactsController @Post()` | ✅ |
| `contacts_get` | `GET /contacts/{contactId}` | `ContactsController @Get(':id')` | ✅ |
| `contacts_update` | `PATCH /contacts/{contactId}` | `ContactsController @Patch(':id')` | ✅ |
| `contacts_delete` | `DELETE /contacts/{contactId}` | `ContactsController @Delete(':id')` | ✅ |
| `contacts_search` | `GET /contacts/search?q={query}` | `ContactsController @Get('search')` | ✅ |

### Deals (6) ✅
| Tool | MCP Endpoint | Backend Controller | Status |
|------|--------------|-------------------|--------|
| `deals_list` | `GET /deals` | `DealsController @Get()` | ✅ |
| `deals_create` | `POST /deals` | `DealsController @Post()` | ✅ |
| `deals_get` | `GET /deals/{dealId}` | `DealsController @Get(':id')` | ✅ |
| `deals_update` | `PATCH /deals/{dealId}` | `DealsController @Patch(':id')` | ✅ |
| `deals_delete` | `DELETE /deals/{dealId}` | `DealsController @Delete(':id')` | ✅ |
| `deals_move` | `PATCH /deals/{dealId}/move` | `DealsController @Patch(':id/move')` | ✅ |

### Leads (5) ✅
| Tool | MCP Endpoint | Backend Controller | Status |
|------|--------------|-------------------|--------|
| `leads_list` | `GET /leads` | `LeadsController @Get()` | ✅ |
| `leads_create` | `POST /leads` | `LeadsController @Post()` | ✅ |
| `leads_get` | `GET /leads/{leadId}` | `LeadsController @Get(':id')` | ✅ |
| `leads_update` | `PATCH /leads/{leadId}` | `LeadsController @Patch(':id')` | ✅ |
| `leads_convert` | `POST /leads/{leadId}/convert` | `LeadsController @Post(':id/convert')` | ✅ |
| `leads_delete` | `DELETE /leads/{leadId}` | `LeadsController @Delete(':id')` | ✅ |

### Tickets (7) ✅
| Tool | MCP Endpoint | Backend Controller | Status |
|------|--------------|-------------------|--------|
| `tickets_list` | `GET /tickets` | `TicketsController @Get()` | ✅ |
| `tickets_create` | `POST /tickets` | `TicketsController @Post()` | ✅ |
| `tickets_get` | `GET /tickets/{ticketId}` | `TicketsController @Get(':id')` | ✅ |
| `tickets_update` | `PATCH /tickets/{ticketId}` | `TicketsController @Patch(':id')` | ✅ |
| `tickets_delete` | `DELETE /tickets/{ticketId}` | `TicketsController @Delete(':id')` | ✅ |
| `tickets_comment` | `POST /tickets/{ticketId}/comments` | `TicketsController @Post(':id/comments')` | ✅ |
| `tickets_assign` | `PATCH /tickets/{ticketId}/assign` | ❌ **NOT FOUND** |

### Analytics (5) ✅
| Tool | MCP Endpoint | Backend Controller | Status |
|------|--------------|-------------------|--------|
| `analytics_dashboard` | `GET /analytics/dashboard` | `AnalyticsController @Get('dashboard')` | ✅ |
| `analytics_revenue` | `GET /analytics/revenue` | `AnalyticsController @Get('revenue')` | ✅ |
| `analytics_pipeline` | `GET /analytics/pipeline` | ❌ Wrong - should be `/analytics/conversion` |
| `analytics_team` | `GET /analytics/team` | ❌ **NOT FOUND** |
| `analytics_contacts` | `GET /analytics/contacts` | ❌ **NOT FOUND** |

### Users (5) ✅
| Tool | MCP Endpoint | Backend Controller | Status |
|------|--------------|-------------------|--------|
| `users_list` | `GET /users` | `UsersController @Get()` | ✅ |
| `users_get` | `GET /users/{userId}` | ❌ **NOT FOUND** - only has `/me/profile` |
| `users_invite` | `POST /users/invite` | `UsersController @Post('invite')` | ✅ |
| `users_update_role` | `PATCH /users/{userId}/role` | `UsersController @Patch(':id/role')` | ✅ |
| `users_deactivate` | `DELETE /users/{userId}` | `UsersController @Delete(':id')` | ✅ |

### Pipelines (4) ✅
| Tool | MCP Endpoint | Backend Controller | Status |
|------|--------------|-------------------|--------|
| `pipelines_list` | `GET /pipelines` | `PipelinesController @Get()` | ✅ |
| `pipelines_create` | `POST /pipelines` | `PipelinesController @Post()` | ✅ |
| `pipelines_update` | `PATCH /pipelines/{pipelineId}` | `PipelinesController @Patch(':id')` | ✅ |
| `pipelines_delete` | `DELETE /pipelines/{pipelineId}` | `PipelinesController @Delete(':id')` | ✅ |

### Stages (3) ⚠️
| Tool | MCP Endpoint | Backend Controller | Status |
|------|--------------|-------------------|--------|
| `stages_list` | `GET /pipelines/{pipelineId}/stages` | `StagesController @Get()` with query param | ⚠️ **Wrong endpoint format** |
| `stages_create` | `POST /stages` | `StagesController @Post()` | ✅ |
| `stages_update` | `PATCH /stages/{stageId}` | `StagesController @Patch(':id')` | ✅ |

**Fix**: Backend uses `GET /stages?pipelineId=X`, not `/pipelines/{id}/stages`

---

## ❌ Non-Existent Endpoints (8 tools)

### Activities (3) - NO CONTROLLER FOUND
| Tool | MCP Endpoint | Backend Status |
|------|--------------|---------------|
| `activities_list` | `GET /activities` | ❌ **NO ActivitiesController** |
| `activities_get` | `GET /activities/{activityId}` | ❌ **NO ActivitiesController** |
| `activities_create` | `POST /activities` | ❌ **NO ActivitiesController** |

**Impact**: Users asking "Log a call with John" will fail. MCP will return 404.

### Portal (5) - NO GENERIC PORTAL CONTROLLER
| Tool | MCP Endpoint | Backend Status |
|------|--------------|---------------|
| `portal_customers_list` | `GET /portal/customers` | ✅ `PortalCustomersController @Get()` |
| `portal_tickets_list` | `GET /portal/tickets` | ✅ `PortalTicketsController @Get()` |
| `portal_tickets_create` | `POST /portal/tickets` | ✅ `PortalTicketsController @Post()` |
| `portal_send_message` | `POST /portal/tickets/{ticketId}/messages` | ❌ **NOT FOUND** |
| `portal_get_status` | `GET /portal/status` | ❌ **NOT FOUND** |

**Portal endpoints exist but are specialized** - 3/5 work, 2/5 missing.

### Webhooks (3) - ONLY JIRA/ZAMMAD WEBHOOKS EXIST
| Tool | MCP Endpoint | Backend Status |
|------|--------------|---------------|
| `webhooks_list` | `GET /webhooks` | ❌ **NO WebhooksController** |
| `webhooks_create` | `POST /webhooks` | ❌ **NO WebhooksController** |
| `webhooks_delete` | `DELETE /webhooks/{webhookId}` | ❌ **NO WebhooksController** |

**Backend only has**:
- `JiraWebhooksController` (`@Controller('jira/webhooks')`)
- `ZammadWebhooksController` (`@Controller('zammad/webhooks')`)

---

## 🔧 Tool Name Inconsistencies

### Gemini Service vs MCP Server
| Gemini Tool Name | MCP Tool Name | Fix |
|------------------|---------------|-----|
| `deals_move_stage` | `deals_move` | ✅ Use `deals_move` (matches backend) |
| `tickets_close` | *(not in MCP)* | ❌ Remove from Gemini (no backend endpoint) |

---

## 🚨 Critical Fixes Required

### Priority 1: Fix Stages Endpoint
**Problem**: MCP uses `GET /pipelines/{pipelineId}/stages`  
**Reality**: Backend uses `GET /stages?pipelineId=X`

**Fix in `server_unified.py`**:
```python
"stages_list": ("GET", "/stages?pipelineId={pipelineId}"),  # Not /pipelines/{id}/stages
```

### Priority 2: Fix Analytics Endpoints
**Problem**: MCP references non-existent endpoints  
**Available Backend Endpoints**:
```typescript
GET /analytics/dashboard ✅
GET /analytics/revenue ✅
GET /analytics/win-loss (not in MCP)
GET /analytics/conversion (MCP calls it "pipeline")
GET /analytics/velocity (not in MCP)
GET /analytics/pipeline-health (not in MCP)
GET /analytics/top-performers (not in MCP)
GET /analytics/forecast (not in MCP)
GET /analytics/time-series (not in MCP)
```

**Fix**: Replace `analytics_team` and `analytics_contacts` with actual backend endpoints or remove them.

### Priority 3: Remove Non-Working Tools
**Immediate Action**: Comment out or remove these tools from MCP server:
```python
# Tool(name="activities_list", ...) - NO BACKEND
# Tool(name="activities_get", ...) - NO BACKEND  
# Tool(name="activities_create", ...) - NO BACKEND
# Tool(name="webhooks_list", ...) - NO BACKEND
# Tool(name="webhooks_create", ...) - NO BACKEND
# Tool(name="webhooks_delete", ...) - NO BACKEND
# Tool(name="portal_send_message", ...) - NO BACKEND
# Tool(name="portal_get_status", ...) - NO BACKEND
```

### Priority 4: Fix Gemini Service Tool Names
**File**: `server/src/chatbot/gemini.service.ts`

**Change**:
```typescript
// OLD
{ name: 'deals_move_stage', ... }
{ name: 'tickets_close', ... }

// NEW
{ name: 'deals_move', ... }  // Match MCP & backend
// Remove tickets_close (no backend endpoint)
```

---

## 📊 Summary Statistics

| Category | Total Tools | Working | Broken | Missing |
|----------|-------------|---------|--------|---------|
| **Contacts** | 6 | 6 | 0 | 0 |
| **Deals** | 6 | 6 | 0 | 0 |
| **Leads** | 6 | 6 | 0 | 0 |
| **Tickets** | 7 | 6 | 1 | 0 |
| **Analytics** | 5 | 2 | 3 | 0 |
| **Users** | 5 | 4 | 1 | 0 |
| **Pipelines** | 4 | 4 | 0 | 0 |
| **Stages** | 3 | 2 | 1 | 0 |
| **Activities** | 3 | 0 | 0 | 3 |
| **Portal** | 5 | 3 | 0 | 2 |
| **Webhooks** | 3 | 0 | 0 | 3 |
| **Auth** | 3 | 3 | 0 | 0 |
| **TOTAL** | **56** | **42** | **6** | **8** |

**Success Rate**: 42/56 = **75%**  
**Broken Mappings**: 6 tools (10.7%)  
**Missing Backends**: 8 tools (14.3%)

---

## 🛠️ Recommended Actions

### Immediate (Stop Production Failures)
1. ✅ Remove 8 non-working tools from MCP server
2. ✅ Fix `stages_list` endpoint mapping
3. ✅ Rename `deals_move_stage` → `deals_move` in Gemini
4. ✅ Remove `tickets_close` from Gemini (no backend)
5. ✅ Fix analytics tool names to match actual endpoints

### Short-Term (Improve Functionality)
6. ⚠️ Implement `ActivitiesController` in backend (high user value)
7. ⚠️ Add missing analytics endpoints or document limitations
8. ⚠️ Implement generic WebhooksController (currently Jira/Zammad only)

### Long-Term (Consistency)
9. 📋 Create OpenAPI spec for backend API
10. 📋 Auto-generate MCP tool definitions from OpenAPI
11. 📋 Add integration tests: MCP → Backend → Database

---

## 🧪 Testing Commands

### Test Working Tools
```bash
# Contacts (should work)
"Show all my contacts"
"Create contact John Doe, john@acme.com"

# Deals (should work)  
"Show all deals"
"Create a deal for Acme Corp, $50,000"

# Analytics (partially broken)
"Show me the dashboard"  # Works
"Show revenue forecast"  # Works
"Show team performance" # FAILS - no backend endpoint
```

### Test Broken Tools
```bash
# Activities (will fail - no controller)
"Log a call with John Doe"  # FAILS

# Webhooks (will fail - no controller)
"List all webhooks"  # FAILS

# Stages (wrong endpoint format)
"Show stages for pipeline X"  # May fail depending on ID format
```

---

## 📝 Files to Update

1. **`mcp-server-python/server_unified.py`** - Lines 820-900 (endpoint_map)
2. **`mcp-server-python/tools_catalog.py`** - Remove non-working tools
3. **`server/src/chatbot/gemini.service.ts`** - Lines 100-820 (getCRMTools)
4. **`.github/copilot-instructions.md`** - Update tool counts (56 → 48)

---

**Next Steps**: Proceed with automated fixes using `multi_replace_string_in_file` to update all 4 files simultaneously.
