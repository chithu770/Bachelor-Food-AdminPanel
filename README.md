# Bachelor Foods Admin

A React + Firebase admin dashboard for managing hotels, food products, authentication, and a cart workflow.

## Setup

```bash
npm install
npm run dev
```

Firebase configuration is stored in `.env` using Vite variables. Update those values if you move to another Firebase project.

## Firebase

Enable these products in Firebase Console:

- Authentication: Email/password provider
- Firestore Database

The app uses these Firestore collections:

- `products`
- `hotels`
- `carts/{userId}/items`
