# Bakery Admin Panel

A React + TypeScript admin application for managing bread and pastry orders.

## Tech Stack

- React + TypeScript
- shadcn/ui (Radix-based components)
- @tanstack/react-table
- @tanstack/react-query
- Zod for validation
- Vite for build tooling
- Tailwind CSS for styling

## Features

- ✅ Fetch orders from n8n webhook
- ✅ Display orders in a sortable table
- ✅ Filter orders by status
- ✅ Search orders by recipient or phone
- ✅ View order details in a drawer
- ✅ Parse ordered articles from raw string format
- ✅ Status badges with color coding
- ⏳ Status update mutation (prepared, disabled)
- ⏳ PDF export (planned)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── app/
│   └── OrdersPage.tsx          # Main orders page with filters
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── OrdersTable.tsx          # Table component with TanStack Table
│   ├── StatusBadge.tsx          # Status badge component
│   ├── StatusDropdown.tsx       # Status dropdown component
│   └── OrderDetailsModal.tsx    # Order details dialog
├── hooks/
│   ├── useOrdersQuery.ts        # React Query hook for fetching orders
│   └── useUpdateOrderStatus.ts  # Mutation hook (prepared, disabled)
├── lib/
│   ├── api.ts                   # API layer with fetchOrders
│   ├── orderParser.ts           # Parser for ordered articles
│   ├── orderMapper.ts           # Mapper from API to frontend model
│   └── utils.ts                 # Utility functions
└── types/
    └── order.ts                 # Zod schemas and TypeScript types
```

## Data Source

Orders are fetched from:
```
GET https://n8n.aleksthecoder.com/webhook/bread-orders
```

## TODO

- [ ] Implement status update webhook endpoint
- [ ] Enable status update mutation
- [ ] Add PDF export functionality
- [ ] Add pagination for large order lists
- [ ] Add date range filtering
