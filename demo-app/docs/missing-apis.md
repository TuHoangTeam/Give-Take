# Missing API Integrations for Give & Take App

This file lists the remaining API endpoints that the mobile app screens should connect to. All endpoints are served from `http://34.61.142.200/api`.

## Items & Discovery
- `POST /items` — Create item (multipart: images[], title, description, categoryId, type, condition, location, lat, lng). Screens: Add Item.
- `GET /items` — Already used on Home (filters: search, category, type, page, limit). Ensure uses live category IDs.
- `GET /items/{id}` — Already used on Item Detail. Remaining actions below are missing.
- `GET /items/my/all` — Get my items (status filter). Screen: future "My listings".
- `PUT /items/{id}` — Update item. Screen: edit listing.
- `DELETE /items/{id}` — Delete item (soft delete). Screen: manage my listings.

## Favorites
- `POST /favorites` — Add item to favorites (body likely itemId). Screen: Item Detail heart, Home card heart.
- `GET /favorites` — List favorite items. Screen: Favorites list (not built yet).
- `DELETE /favorites/{itemId}` — Remove favorite. Screen: Item Detail / Favorites list.

## Wishlists (Radar)
- `POST /wishlists` — Create wishlist alert. Screen: Radar create in Wishlist.
- `GET /wishlists/my` — List my wishlists. Screen: Wishlist list (replace mock).
- `GET /wishlists/{id}/matches` — Get matches for a wishlist. Screen: Wishlist detail/matches.
- `PUT /wishlists/{id}` — Update wishlist. Screen: edit wishlist entry.
- `DELETE /wishlists/{id}` — Delete wishlist. Screen: Wishlist list.
- `GET /wishlists/public` — Public community wishes. Screen: Public Wishlist (replace mock feed).

## Transactions (Request/Exchange flow)
- `POST /transactions` — Create transaction request for an item. Screen: Item Detail “Tôi muốn xin”.
- `GET /transactions/my` — My transactions list. Screen: Transactions list (missing).
- `PATCH /transactions/{id}/confirm-giver` — Giver confirms handoff. Screen: transaction detail.
- `PATCH /transactions/{id}/confirm-receiver` — Receiver confirms receipt. Screen: transaction detail.
- `PATCH /transactions/{id}/complete` — Force complete. Screen: admin/fallback.

## Ratings
- `POST /ratings` — Rate a transaction. Screen: post-transaction rating modal.
- `GET /ratings/users/{userId}` — Ratings of a user. Screen: Item owner profile / ratings tab.

## Points (G-Point)
- `GET /points/balance` — Current point balance. Screen: Points wallet header.
- `GET /points/history` — Point transactions. Screen: Points history list.
- `GET /points/check/{amount}` — Validate sufficient points before request. Screen: Item Detail CTA guard.

## Gamification & Eco
- `GET /achievements` — List all achievements. Screen: Achievements display.
- `GET /achievements/my` — User achievements progress. Screen: Profile achievements section.
- `GET /eco/impact/me` — My eco impact (co2, trees, trash). Screen: Eco dashboard (replace mock numbers).
- `GET /eco/leaderboard` — Eco leaderboard. Screen: Eco leaderboard view (missing).

## Notifications
- `GET /notifications` — List notifications. Screen: Notifications center (missing).
- `PATCH /notifications/{id}/read` — Mark one as read. Screen: notifications item actions.
- `PATCH /notifications/read-all` — Mark all as read. Screen: bulk action.
- `DELETE /notifications/{id}` — Delete notification. Screen: notifications item actions.

## User Profile
- `GET /users/me` — Current profile. Screen: Profile (replace mock).
- `PUT /users/me` — Update profile. Screen: Edit Profile save.
- `POST /users/me/avatar` — Upload avatar. Screen: Edit Profile avatar update.
- `GET /users/{id}` — Public profile info. Screen: viewing other user from item/transactions.
- `GET /users/{id}/stats` — User statistics. Screen: public profile stats.

## Auth Session
- `POST /auth/logout` — Logout user; clear refresh tokens. Screen: Settings logout action.
- `POST /auth/refresh` — Refresh access token. Screen: global token refresh logic (not wired).

## Reports & System
- `POST /reports` — Create report (user/item). Screen: report button (missing).
- `GET /stats/app` — App overview stats (optional admin/stats screen).

## Conversation / Chat
- Conversation/message endpoints exist in backend (conversation.controller). Need:
  - Create/list conversations for an item/participants.
  - Send message in conversation.
  - List messages in conversation.
Screen: Chat should replace mock thread with real data.

## Categories
- `GET /categories` — Already used on Home. Ensure used on Add Item instead of hardcoded list.
- `GET /categories/{id}` — Optional detail.

## How to prioritize
1) Transactions + favorites + wishlists (core flows).
2) Points balance/history + eco impact + achievements (user value).
3) Notifications + ratings + reports (trust & safety).
4) Chat integration to replace mocks.
