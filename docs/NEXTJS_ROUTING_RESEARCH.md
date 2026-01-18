# Next.js Advanced Routing Research for Private Conversations

## Overview

This document explores Next.js App Router's advanced routing features (parallel routes, intercepting routes, route groups) for implementing grandma private conversations.

---

## Routing Options Comparison

### Option A: Client-Side Modal (Current Plan)
**What we have planned:** A React modal component managed by state

```
app/
├── layout.tsx
├── page.tsx              # Main counsel chat
└── api/
    ├── chat/route.ts
    └── private-chat/route.ts

components/
└── private-chat-modal.tsx  # Client-side modal
```

**Pros:**
- Simple implementation
- No routing complexity
- Fast to build
- State persists naturally

**Cons:**
- No shareable URLs for private chats
- No deep linking
- Browser back button doesn't close modal
- Can't bookmark a conversation

---

### Option B: Parallel Routes with Intercepting Routes
**Next.js recommended pattern for modals with URLs**

```
app/
├── layout.tsx              # Renders {children} + {privateChat}
├── page.tsx                # Main counsel chat
├── @privateChat/
│   ├── default.tsx         # Returns null (required)
│   ├── (.)chat/
│   │   └── [grandmaId]/
│   │       └── page.tsx    # Modal version (intercepted)
│   └── page.tsx            # Returns null
└── chat/
    └── [grandmaId]/
        └── page.tsx        # Full page version (direct navigation)
```

**How it works:**
1. User on `/` clicks Nana Ruth avatar
2. URL changes to `/chat/nana-ruth`
3. `(.)chat/[grandmaId]` INTERCEPTS the route
4. Modal renders over the main page (both visible)
5. User refreshes → sees full page at `/chat/nana-ruth`
6. User shares link → recipient sees full page

**Pros:**
- Shareable URLs (`/chat/nana-ruth`)
- Deep linking works
- Browser back closes modal
- SEO-friendly full pages
- "Professional" feel

**Cons:**
- Complex folder structure
- Known bugs in Next.js 14/15 with this pattern
- Modal dismissal issues (see research below)
- Requires `usePathname()` checks to prevent ghost modals
- Need to restart dev server when changing structure

---

### Option C: Route Groups + Parallel Routes (Hybrid)
**Organize routes while keeping modal pattern**

```
app/
├── layout.tsx
├── (main)/
│   ├── layout.tsx          # Main app layout
│   ├── page.tsx            # Counsel chat
│   └── @privateChat/
│       ├── default.tsx
│       └── (.)chat/
│           └── [grandmaId]/
│               └── page.tsx
└── chat/
    └── [grandmaId]/
        └── page.tsx        # Standalone page
```

**Why route groups:**
- `(main)` doesn't affect URL
- Cleaner organization
- Can have different layouts per group

---

### Option D: Query Parameter Approach (Simplest URL-based)
**URL state without parallel routes**

```
app/
├── layout.tsx
├── page.tsx    # Reads ?chat=nana-ruth, shows modal if present
```

**URL:** `/?chat=nana-ruth`

**Implementation:**
```tsx
// app/page.tsx
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const activeChat = searchParams.get('chat') as GrandmaId | null;

  return (
    <>
      <CounselChat />
      {activeChat && (
        <PrivateChatModal grandmaId={activeChat} />
      )}
    </>
  );
}
```

**Pros:**
- Shareable URLs (`/?chat=nana-ruth`)
- Simple implementation
- No parallel route complexity
- Back button works naturally

**Cons:**
- Less "clean" URLs
- No separate full-page view
- All logic in one page component

---

## Known Issues with Parallel + Intercepting Routes

Based on [GitHub Discussion #71586](https://github.com/vercel/next.js/discussions/71586) and [Discussion #50284](https://github.com/vercel/next.js/discussions/50284):

### Issue 1: Modal Persistence
**Problem:** Layouts don't re-render, so modals stay in DOM after navigation.

**Solution:** Check pathname in modal component:
```tsx
"use client";
import { usePathname } from "next/navigation";

export default function PrivateChatModal({ grandmaId }) {
  const pathname = usePathname();

  // Only render when route matches
  if (pathname !== `/chat/${grandmaId}`) return null;

  return <Modal>...</Modal>;
}
```

### Issue 2: Multiple Modals Showing
**Problem:** Having `@modal1` and `@modal2` slots causes both to render.

**Solution:** Put ALL intercepted routes under ONE parallel slot:
```
@privateChat/
├── (.)chat/nana-ruth/
├── (.)chat/abuela-carmen/
├── (.)chat/ba-nguyen/
├── (.)chat/grandma-edith/
└── (.)chat/bibi-amara/
```

Or use dynamic segment:
```
@privateChat/
└── (.)chat/[grandmaId]/
```

### Issue 3: Forward Navigation Doesn't Close Modal
**Problem:** `router.push()` to a new route doesn't dismiss modal.

**Solution:** Use `replace` prop on Link or track pathname:
```tsx
<Link href="/somewhere" replace>
  Navigate
</Link>
```

### Issue 4: Catch-All Routes Don't Work as Expected
**Problem:** `[...catchAll]` in parallel slot doesn't reliably close modals.

**Status:** Unresolved as of Next.js 15.1.6

---

## Recommended Approach for Grandmas App

### For MVP: Option D (Query Parameters)

**Why:**
1. Fastest to implement
2. Shareable URLs work
3. No Next.js routing bugs to fight
4. Back button works naturally
5. Can upgrade to parallel routes later

**Implementation:**

```tsx
// app/page.tsx
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { CounselChat } from '@/components/counsel-chat';
import { PrivateChatModal } from '@/components/private-chat-modal';
import { GrandmaId, GRANDMA_IDS } from '@/lib/types';

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const chatParam = searchParams.get('chat');
  const activeGrandma = GRANDMA_IDS.includes(chatParam as GrandmaId)
    ? (chatParam as GrandmaId)
    : null;

  const openPrivateChat = (grandmaId: GrandmaId) => {
    router.push(`/?chat=${grandmaId}`, { scroll: false });
  };

  const closePrivateChat = () => {
    router.push('/', { scroll: false });
  };

  return (
    <>
      <CounselChat onGrandmaClick={openPrivateChat} />
      <PrivateChatModal
        grandmaId={activeGrandma}
        onClose={closePrivateChat}
      />
    </>
  );
}
```

**URL Examples:**
- Main page: `/`
- Chat with Nana Ruth: `/?chat=nana-ruth`
- Chat with Bibi Amara: `/?chat=bibi-amara`

---

### For Future: Option B (Parallel + Intercepting)

If we want cleaner URLs and full-page fallbacks later:

**Folder Structure:**
```
app/
├── layout.tsx
├── page.tsx
├── default.tsx                    # Required for parallel routes
├── @privateChat/
│   ├── default.tsx               # Returns null
│   └── (.)chat/
│       └── [grandmaId]/
│           └── page.tsx          # Modal version
└── chat/
    └── [grandmaId]/
        ├── page.tsx              # Full page version
        └── layout.tsx            # Optional: different layout
```

**Root Layout:**
```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  privateChat,
}: {
  children: React.ReactNode;
  privateChat: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        {privateChat}
      </body>
    </html>
  );
}
```

**Intercepted Modal Page:**
```tsx
// app/@privateChat/(.)chat/[grandmaId]/page.tsx
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { PrivateChatModal } from '@/components/private-chat-modal';
import { GrandmaId } from '@/lib/types';

export default function PrivateChatInterceptedPage({
  params,
}: {
  params: { grandmaId: GrandmaId };
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Prevent ghost modal
  if (!pathname.startsWith('/chat/')) return null;

  return (
    <PrivateChatModal
      grandmaId={params.grandmaId}
      onClose={() => router.back()}
    />
  );
}
```

**Full Page Version:**
```tsx
// app/chat/[grandmaId]/page.tsx
import { PrivateChatFullPage } from '@/components/private-chat-full-page';
import { GrandmaId } from '@/lib/types';

export default function PrivateChatPage({
  params,
}: {
  params: { grandmaId: GrandmaId };
}) {
  return <PrivateChatFullPage grandmaId={params.grandmaId} />;
}
```

**URL Examples:**
- Main page: `/`
- Chat with Nana Ruth: `/chat/nana-ruth` (modal when navigating from `/`, full page on direct visit)

---

## Intercepting Route Notation Reference

| Convention | Matches |
|------------|---------|
| `(.)folder` | Same level |
| `(..)folder` | One level up |
| `(..)(..)folder` | Two levels up |
| `(...)folder` | From app root |

**Important:** The `(..)` convention is based on **route segments**, not file-system levels. Parallel route slots (`@folder`) are NOT counted as segments.

---

## Animation Considerations

Per [GitHub Discussion #65735](https://github.com/vercel/next.js/discussions/65735):

For animating parallel/intercepting route modals, wrap in Framer Motion:

```tsx
import { AnimatePresence, motion } from 'framer-motion';

export function PrivateChatModal({ grandmaId, onClose }) {
  return (
    <AnimatePresence>
      {grandmaId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-96"
          >
            {/* Content */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## Recommendation Summary

| Phase | Approach | URLs | Complexity |
|-------|----------|------|------------|
| **MVP** | Query params | `/?chat=nana-ruth` | Low |
| **V2** | Parallel + Intercepting | `/chat/nana-ruth` | High |

**Start with query parameters** - they provide shareable URLs with minimal complexity. Upgrade to parallel routes later if cleaner URLs become important.

---

## Sources

- [Next.js Parallel Routes Docs](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)
- [Next.js Intercepting Routes Docs](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [GitHub Discussion #71586 - Parallel and Intercepting Route Modals](https://github.com/vercel/next.js/discussions/71586)
- [GitHub Discussion #50284 - Modals not dismissing](https://github.com/vercel/next.js/discussions/50284)
- [GitHub Discussion #65735 - Animating parallel routes](https://github.com/vercel/next.js/discussions/65735)
- [krishnerkar/next-intercepting-routes-demo](https://github.com/krishnerkar/next-intercepting-routes-demo)
- [Pro Next.js - Parallel Routes for Chat Sidebar](https://www.pronextjs.dev/workshops/next-js-foundations-for-professional-web-development~lxb18/implement-parallel-routes-for-a-chat-menu-sidebar)
