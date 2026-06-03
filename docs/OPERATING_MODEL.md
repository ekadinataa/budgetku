# BudgetX — Operating Model

**Version:** 1.0  
**Last Updated:** July 2025  
**Status:** Production  

---

## 1. Product Overview

### What is BudgetX?

BudgetX (formerly BudgetKu) is a comprehensive personal finance management web application designed for Indonesian users. It combines expense tracking, budget planning, debt management, investment portfolio tracking, and long-term FIRE (Financial Independence, Retire Early) planning into a single, cohesive interface.

### Value Proposition

| Aspect | Value |
|--------|-------|
| Language | Fully Indonesian UI — no language barrier |
| Cost | Free to use (no premium tiers) |
| Privacy | Per-user data isolation; no data monetization |
| Accessibility | Works on any device with a browser |
| Simplicity | No server to manage; serverless architecture |
| Completeness | 10+ financial tools in one app (budget, debt, invest, FIRE, etc.) |
| Flexibility | Works with or without an account (local-only mode) |

### Target Users

- Indonesian millennials and Gen-Z professionals (22–40)
- First-time budgeters who want a simple, native-language tool
- Users tracking finances across multiple e-wallets and bank accounts
- Individuals planning for financial independence (FIRE community)
- Freelancers with variable income who need flexible budget periods

### Key Metrics (Success Indicators)

- Monthly Active Users (MAU)
- Data retention (users with >30 days of transactions)
- Feature adoption (% users using debt, investment, FIRE features)
- Firestore read/write usage (capacity indicator)

---

## 2. Service Architecture

### Architecture Type: Serverless Client-Side SPA

```
┌────────────────────────────────────────────────────────────────────┐
│                          User's Browser                             │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React 19 SPA (Vite)                        │  │
│  │                                                              │  │
│  │  • All business logic runs client-side                       │  │
│  │  • Pure computation (no server-side processing)              │  │
│  │  • CSS Modules for scoped styling                            │  │
│  │  • Recharts for data visualization                           │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                           │                                        │
└───────────────────────────┼────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Firebase (Google Cloud)                         │
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Firebase Auth   │  │    Firestore    │  │ Firebase Hosting  │  │
│  │                 │  │   (NoSQL DB)    │  │   (CDN + SSL)    │  │
│  │  • Email/Pass   │  │  • Per-user     │  │  • Global CDN    │  │
│  │  • Session mgmt │  │  • Real-time    │  │  • Auto SSL      │  │
│  │  • Password     │  │  • Security     │  │  • Immutable     │  │
│  │    reset        │  │    rules        │  │    assets cache  │  │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| No backend server | Reduces operational complexity to zero; Firebase handles all infrastructure |
| Client-side computation | All calculations (annuity, FIRE projections, amortization) run in browser — no server cost |
| No state management library | App complexity doesn't warrant Redux/Zustand overhead; lifted state is sufficient |
| No router library | Single-page app with state-based navigation avoids bundle size increase |
| Firebase SDK (client-side) | Direct Firestore access with security rules; no API layer needed |
| localStorage fallback | Enables full functionality without account creation |

---

## 3. Data Flow

### Authenticated User Flow

```
User Action (e.g., "Create Transaction")
    │
    ▼
React Component (form submit)
    │
    ▼
App.jsx Handler (handleCreateTransaction)
    │
    ├── Validate input (validator.js)
    │
    ├── Call firestoreService.createTransaction(data)
    │       │
    │       ├── Get auth.currentUser.uid
    │       ├── Build Firestore batch:
    │       │     • Set transaction document
    │       │     • Update wallet balance (increment)
    │       │     • Update destination wallet (if transfer)
    │       ├── batch.commit()
    │       └── Return created document
    │
    ├── Update local React state (setTransactions, setWallets)
    │
    └── Show toast notification ("Transaksi berhasil dibuat")
```

### Local-Only User Flow

```
User Action
    │
    ▼
React Component (form submit)
    │
    ▼
App.jsx Handler
    │
    ├── Validate input
    ├── Generate local ID ('tx' + Date.now())
    ├── Update React state directly
    │
    └── useEffect triggers → localStorage.setItem(JSON.stringify(allState))
```

### Data Loading on Authentication

```
Firebase Auth → onAuthStateChanged(user)
    │
    ▼
Check localStorage for existing data
    │
    ├─ Has data → Show DataMigrator component
    │               ├── "Migrate" → batch write to Firestore → fetchAllData()
    │               └── "Skip" → fetchAllData()
    │
    └─ No data → fetchAllData()
                    │
                    ▼
               api.initUser() (idempotent — creates defaults for new users)
                    │
                    ▼
               Promise.all([
                 getWallets(),
                 getTransactions(),
                 getBudgets(),
                 getCategories(),
                 getPreferences(),
                 getRecurringItems(),
                 getDebts(),
                 getInvestments(),
                 getFixedAssets(),
               ])
                    │
                    ▼
               Populate all useState hooks → UI renders
```

---

## 4. Availability & Reliability

### Service Level Expectations

| Component | Provider SLA | Impact on BudgetX |
|-----------|-------------|-------------------|
| Firebase Hosting | 99.95% | App inaccessible if down |
| Firebase Auth | 99.95% | Cannot login; existing sessions may persist |
| Cloud Firestore | 99.999% (multi-region) | Cannot read/write data |
| Client-side logic | N/A | Always available once loaded |
| localStorage | N/A | Always available (browser-dependent) |

### Resilience Characteristics

**No single point of failure for core functionality:**
- If Firestore is down → authenticated users see cached data (last loaded state in React)
- If Firebase Auth is down → existing sessions continue; new logins fail
- If Hosting CDN has issues → users with cached PWA/browser cache can still use the app
- Local-only mode → operates entirely without network

**Graceful degradation:**
- Network errors show toast: "Gagal memuat data. Periksa koneksi Anda."
- Retry button available on data load failure
- Preferences auto-save failures are silent (non-critical)
- FIRE settings load failure doesn't block the rest of the app

### Recovery

- Firebase Hosting: automatic (CDN rerouting)
- Firestore: automatic (Google-managed)
- App-level: user refreshes browser → re-fetches all data

---

## 5. Security Model

### Authentication

| Mechanism | Details |
|-----------|---------|
| Provider | Firebase Authentication |
| Methods | Email/password |
| Session | Firebase Auth tokens (auto-refreshed) |
| Password Reset | Email-based via Firebase |

### Data Isolation

Firestore security rules enforce strict per-user isolation:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
    // Per-user data access
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Key properties:**
- Users can ONLY access documents under their own `users/{uid}/` path
- Unauthenticated requests are denied entirely
- No admin SDK exposed to client (no privilege escalation possible)
- No cross-user queries possible

### Client-Side Security

| Concern | Mitigation |
|---------|-----------|
| Sensitive data in bundle | Only Firebase config (public keys) in client; no secrets |
| XSS | React's JSX auto-escapes; no dangerouslySetInnerHTML |
| HTTPS | Firebase Hosting enforces HTTPS (HSTS) |
| API keys exposure | Firebase API keys are restricted by domain; not secret |
| Data in transit | TLS 1.3 (Firebase default) |
| Data at rest | Encrypted by Google Cloud (Firestore default) |

### What is NOT Protected

- Local-only mode data: stored in cleartext in localStorage (physical device access = data access)
- Client-side computation: all financial calculations visible in browser DevTools
- No server-side validation: Firestore security rules are the only server-side check

---

## 6. Cost Structure

### Firebase Spark Plan (Free Tier) — Current

| Service | Free Tier Limit | BudgetX Usage Pattern |
|---------|-----------------|-----------------------|
| **Hosting** | 10 GB/month transfer, 1 GB storage | ~2 MB per user load; supports ~5,000 loads/month |
| **Firestore Reads** | 50,000/day | ~100–200 reads per user session |
| **Firestore Writes** | 20,000/day | ~10–50 writes per user session |
| **Firestore Deletes** | 20,000/day | Minimal (occasional) |
| **Firestore Storage** | 1 GiB | ~100 KB per active user |
| **Authentication** | Unlimited users | No cost regardless of user count |

### Estimated Capacity on Free Tier

| Metric | Estimate |
|--------|----------|
| Concurrent active users | ~50–100/day |
| Total registered users | Unlimited (Auth is free) |
| Daily active users (DAU) | ~250–500 (at 100–200 reads each) |
| Stored data | ~10,000 users before hitting 1 GiB |

### When Free Tier is Exceeded

Firestore operations are the first bottleneck:
- At 50K reads/day: ~250–500 DAU (depending on usage intensity)
- At 20K writes/day: ~400–2000 DAU (depending on how many transactions they create)

### Scaling: Blaze Plan (Pay-as-you-go)

| Service | Price |
|---------|-------|
| Firestore Reads | $0.06 per 100K |
| Firestore Writes | $0.18 per 100K |
| Firestore Storage | $0.18/GiB/month |
| Hosting Transfer | $0.15/GB beyond 10 GB |
| Auth | Free (always) |

**Estimated cost at 1,000 DAU:** ~$5–15/month  
**Estimated cost at 10,000 DAU:** ~$50–150/month

---

## 7. Monitoring & Observability

### Currently Available

| Tool | What It Shows |
|------|--------------|
| Firebase Console → Hosting | Bandwidth usage, deployment history |
| Firebase Console → Authentication | User count, sign-in providers, recent activity |
| Firebase Console → Firestore | Document count, read/write/delete operations, storage |
| Firebase Console → Usage & Billing | Daily quota consumption, approaching-limit alerts |
| Browser Console | Client-side errors, network failures |

### Not Yet Implemented

| Tool | Value | Priority |
|------|-------|----------|
| Firebase Performance Monitoring | Page load times, network latency | Medium |
| Firebase Crashlytics | JavaScript error tracking | High |
| Custom analytics (GA4/Mixpanel) | Feature usage, funnel analysis | Medium |
| Uptime monitoring (Pingdom/UptimeRobot) | Availability alerts | Low (Firebase handles this) |
| Error boundaries with reporting | Catch React render errors | Medium |

### Recommendations for Future

1. **Add Firebase Crashlytics** — Catch unhandled JavaScript errors in production
2. **Add Firebase Performance Monitoring** — Track TTI (Time to Interactive) and network latency
3. **Add simple health check** — Periodically verify Firestore connectivity
4. **Set up billing alerts** — Firebase Console → Budget alerts at $5, $10, $25

---

## 8. Incident Response

### Common Issues

| Symptom | Likely Cause | Diagnosis | Resolution |
|---------|-------------|-----------|------------|
| Blank white page | JavaScript error (uncaught exception) | Browser console → look for red errors | Fix the bug, redeploy |
| "Gagal memuat data" toast | Firestore quota exceeded OR network issue | Firebase Console → Firestore usage | Wait for quota reset (midnight PT) or upgrade plan |
| Login not working | Firebase Auth service issue | Firebase Status Dashboard | Wait for Google to resolve |
| Data not saving | Firestore write quota exceeded | Firebase Console → usage | Wait or upgrade plan |
| Slow performance | Large dataset (thousands of transactions) | Performance tab in DevTools | Optimize queries, add pagination |
| Mobile layout broken | CSS overflow issue | Browser DevTools responsive mode | Fix CSS, redeploy |

### Diagnosis Steps

1. **Check browser console** — Look for JavaScript errors
2. **Check network tab** — Look for failed requests (403, 429, 500)
3. **Check Firebase Console** — Verify quota isn't exceeded
4. **Check Firebase Status** — https://status.firebase.google.com
5. **Test in incognito** — Rule out browser extension interference
6. **Test on different device** — Rule out device-specific issues

### Rollback Procedure

```bash
# List recent hosting versions
firebase hosting:channel:list

# Rollback to the previous deployment
firebase hosting:rollback --site budgetx

# Or deploy a specific known-good commit
git checkout <good-commit-hash>
npm run build
firebase deploy --only hosting:budgetx
```

### Escalation Path

1. Developer checks browser console + Firebase Console
2. If Firebase service issue → check status.firebase.google.com → wait
3. If code bug → fix → test locally → deploy
4. If data corruption → user exports/imports data; or manual Firestore cleanup

---

## 9. Maintenance

### Regular Maintenance Tasks

| Task | Frequency | How |
|------|-----------|-----|
| Dependency updates | Monthly | `npm audit`, `npm update`, review changelogs |
| Firebase CLI update | Monthly | `npm install -g firebase-tools` |
| Security rules review | Quarterly | Review `firestore.rules` for any needed changes |
| Unused dependency cleanup | Quarterly | Review `package.json`, remove unused packages |
| Performance review | Quarterly | Check bundle size (`npm run build`), look for regressions |
| Firebase quota check | Weekly | Firebase Console → Usage tab |

### Dependency Update Process

```bash
# Check for vulnerabilities
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update specific package
npm install package-name@latest

# After update: run tests and verify
npm test
npm run build
```

### Security Rules Review Checklist

- [ ] Default deny rule is in place
- [ ] Per-user isolation is enforced
- [ ] No wildcard allow rules
- [ ] No unintended public access paths
- [ ] Test with Firebase emulator if possible

### Data Backup Strategy

BudgetX follows a **user-owned backup** model:

- Users can export their data at any time (Settings → Export JSON/CSV)
- No server-side automated backups (free tier limitation)
- Firestore's built-in replication provides durability (not point-in-time recovery)

**For admin-level backup (if needed):**
```bash
# Requires Google Cloud CLI + Blaze plan
gcloud firestore export gs://your-backup-bucket/$(date +%Y%m%d)
```

---

## 10. Release Process

### Deployment Pipeline

```
Code Change
    │
    ▼
Local Development (npm run dev)
    │
    ├── Write code
    ├── Test manually in browser
    ├── Run linter: npm run lint
    └── Run tests: npm test
    │
    ▼
Build (npm run build)
    │
    ├── Vite + Rolldown produces optimized dist/
    ├── Verify build output (no errors)
    └── Optional: npm run preview (test production build locally)
    │
    ▼
Deploy (firebase deploy --only hosting:budgetx)
    │
    ├── Firebase uploads dist/ to CDN
    ├── New version goes live immediately
    └── Previous version retained (rollback available)
    │
    ▼
Verify Production
    │
    ├── Open https://budgetx.web.app
    ├── Test critical paths (login, create transaction, view reports)
    └── Check browser console for errors
```

### Environment Strategy

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local Dev | localhost:5173 | Development with HMR |
| Production | budgetx.web.app | Live users |

> ⚠️ **No staging environment.** Deployments go directly to production. Rollback is the safety net.

### Deployment Commands

```bash
# Standard deployment
npm run build && firebase deploy --only hosting:budgetx

# Deploy with Firestore rules update
npm run build && firebase deploy

# Emergency rollback
firebase hosting:rollback --site budgetx
```

### Version History

Firebase Hosting retains previous deployment versions automatically. Access via:
- Firebase Console → Hosting → Release History
- CLI: `firebase hosting:channel:list`

---

## 11. Capacity Planning

### Current State: Free Tier (Spark Plan)

| Resource | Limit | Current Usage | Headroom |
|----------|-------|---------------|----------|
| Firestore Reads | 50K/day | Low (<5K) | ~90% |
| Firestore Writes | 20K/day | Low (<2K) | ~90% |
| Firestore Storage | 1 GiB | Minimal | ~99% |
| Hosting Bandwidth | 10 GB/month | Minimal | ~95% |
| Auth Users | Unlimited | Low | ∞ |

### Capacity Thresholds (When to Upgrade)

| Signal | Threshold | Action |
|--------|-----------|--------|
| Firestore reads approaching limit | >40K/day sustained | Upgrade to Blaze |
| Firestore writes approaching limit | >15K/day sustained | Upgrade to Blaze |
| Hosting bandwidth | >8 GB/month | Upgrade to Blaze |
| Firebase Console warnings | Any quota warning | Investigate + plan upgrade |
| User reports of "data not loading" | Any incident | Check quota immediately |

### Migration Path: Spark → Blaze

1. Open Firebase Console → Upgrade plan
2. Add billing account (Google Cloud billing)
3. Set budget alerts ($5, $10, $25, $50)
4. No code changes needed — same APIs, same behavior
5. Monitor daily spending via Firebase Console

### Optimization Strategies (Before Upgrading)

- **Reduce reads:** Load all data once on auth, cache in React state
- **Batch writes:** Already implemented (transaction + balance in one batch)
- **Client-side filtering:** Filter/sort in browser, not via Firestore queries
- **Limit collection sizes:** Pagination for users with >1000 transactions (future)

---

## 12. Team & Responsibilities

### Current Model: Single Developer/Maintainer

| Role | Responsibility |
|------|---------------|
| Frontend Development | React components, pages, styling |
| Backend/Infrastructure | Firebase config, security rules, hosting |
| Product Design | UI/UX decisions, feature prioritization |
| Quality Assurance | Manual testing, property-based tests |
| DevOps/Deployment | Build pipeline, Firebase deploy |
| User Support | Issue resolution, feature requests |
| Documentation | Tech specs, user guide, playbook |

### Bus Factor Mitigation

- Comprehensive documentation (this document + PLAYBOOK + specs)
- No proprietary tooling — all standard open-source stack
- Firebase is managed infrastructure (no ops knowledge required beyond CLI)
- Code is straightforward React (no custom frameworks/meta-frameworks)
- All env vars documented in `.env.example`

### Scaling the Team (If Needed)

| Addition | Would Own |
|----------|-----------|
| 2nd Developer | Feature development, code review |
| Designer | Figma mockups, UX research |
| QA Engineer | Test automation, regression testing |
| DevRel | Community, content, user acquisition |

---

## 13. Future Roadmap Considerations

### Short-Term (Next 3–6 Months)

| Feature | Description | Complexity |
|---------|-------------|-----------|
| PWA Support | Service worker for offline-first experience | Medium |
| Firebase Performance Monitoring | Track real-user performance metrics | Low |
| Transaction Pagination | Handle users with 1000+ transactions efficiently | Medium |
| Recurring Transaction Auto-create | Auto-generate transactions for recurring items on schedule | Medium |
| Receipt Photo Attachment | Capture receipt images, store in Firebase Storage | Medium |

### Medium-Term (6–12 Months)

| Feature | Description | Complexity |
|---------|-------------|-----------|
| AI Financial Chatbot | OpenAI/Gemini integration for personalized advice | High |
| Multi-Currency Support | Handle USD, SGD, etc. with exchange rates | Medium |
| Shared Budgets | Family/couple shared wallets and budgets | High |
| Goal Tracking | Savings goals with progress visualization | Medium |
| Bill Reminders | Push notifications for upcoming bills | Medium |

### Long-Term (12+ Months)

| Feature | Description | Complexity |
|---------|-------------|-----------|
| Mobile Native App | React Native or Flutter for iOS/Android | Very High |
| API for Third-Party Integrations | REST API for bank connections, other apps | High |
| Bank Statement Import | Parse PDF/CSV bank statements automatically | High |
| Open Banking Integration | Direct bank account connection (if available in Indonesia) | Very High |
| Multi-Language | English, Malay support | Medium |
| Premium Tier | Advanced features for paying users (if monetizing) | Medium |

### Technical Debt to Address

| Item | Impact | Effort |
|------|--------|--------|
| Add E2E tests (Playwright/Cypress) | Confidence in deployments | Medium |
| Move to TypeScript | Type safety, better DX | High |
| Add error boundaries | Prevent white screen crashes | Low |
| Implement virtual scrolling | Performance for large datasets | Medium |
| Add Firestore indexes | Query performance at scale | Low |
| Add request deduplication | Prevent double-submits | Low |

### Architecture Evolution Considerations

**Current → Next:**
- SPA → PWA (add service worker, manifest, offline caching)
- Direct Firestore → Firestore + Cloud Functions (for server-side validation, scheduled tasks)
- Manual deploy → CI/CD (GitHub Actions → Firebase deploy on merge to main)
- No monitoring → Firebase Crashlytics + Performance Monitoring

**If scaling significantly (10K+ users):**
- Consider Firestore composite indexes for complex queries
- Consider Cloud Functions for data aggregation (daily/monthly summaries)
- Consider Firebase Extensions for automated backups
- Consider moving heavy computation to Cloud Functions (FIRE projections for shared scenarios)

---

## Appendix: Key URLs & Resources

| Resource | URL |
|----------|-----|
| Production App | https://budgetx.web.app |
| Firebase Console | https://console.firebase.google.com/project/budgetku-app-v1 |
| Firebase Status | https://status.firebase.google.com |
| Firebase Pricing | https://firebase.google.com/pricing |
| Firestore Documentation | https://firebase.google.com/docs/firestore |
| React Documentation | https://react.dev |
| Vite Documentation | https://vite.dev |
