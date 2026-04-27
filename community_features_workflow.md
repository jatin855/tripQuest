# 🤝 TripQuest Community Features: Local Experiences & Marketplace

TripQuest is not just about discovering places; it's about connecting travelers with locals. The platform features two core community-driven sections: **Local Experiences** and the **Marketplace**. 

To maintain quality and safety, both sections operate on an **application and approval-based workflow**. Here is how they work for customers and locals.

---

## 1. Local Experiences (Workshops, Tours, & Events)

This feature allows knowledgeable locals to host authentic experiences, such as a traditional cooking class, a guided heritage walk, or an art workshop.

### **The Workflow (How it works):**

1. **User Role:** Any registered user on TripQuest starts as a standard "Traveler."
2. **Apply to Host:** A user who wants to host an event navigates to the "Become a Host" section and submits a **Host Application**. This application likely details their expertise, the type of experience they want to offer, and their local background.
3. **Admin Review:** The application enters a "Pending" state. A platform Admin reviews the application to ensure it meets TripQuest's quality standards.
4. **Approval & Role Change:** 
   - If **Approved**, the user's role is upgraded to **"Host"** in the database (`userRole = 'host'`).
   - If **Rejected**, the user remains a standard traveler.
5. **Create Experiences:** Once approved as a Host, the user gains access to a specialized Host Dashboard. Here, they can draft, publish, and manage their events or workshops.
6. **Traveler Booking:** Standard users browsing the site can now see these published experiences, read details, and book/join them.

### **Flow Diagram:**
```text
[Standard User] 
      │
      ▼
[Submit Host Application] ──► (Application Status: Pending)
      │
      ▼
[Admin Dashboard] ──► Reviews Application
      │
      ├──► (Rejected) ──► User remains standard traveler
      │
      └──► (Approved) ──► User Role updated to "Host"
                                  │
                                  ▼
[Host Dashboard] ──► Host publishes a Local Experience / Event
                                  │
                                  ▼
[TripQuest Site] ──► Standard Users can browse & join the event
```

---

## 2. The Marketplace (Local Handicrafts & Goods)

The Marketplace allows local artisans and shopkeepers to sell authentic regional products (e.g., Rajasthani textiles, organic spices) directly to travelers.

### **The Workflow (How it works):**

1. **User Role:** A registered user navigates to the Marketplace.
2. **Apply to Sell:** To sell items, the user must apply for a shop. They submit a **Shop Owner Application**, detailing their business, the types of regional goods they craft or sell, and their location.
3. **Admin Review:** The application is marked as "Pending" (`shopApplicationStatus = 'pending'`). The Admin reviews the application via the Marketplace Admin panel.
4. **Approval & Access:** 
   - If **Approved**, the user's shop status is updated (`shopApplicationStatus = 'approved'`).
   - If **Rejected**, they cannot open a shop.
5. **Add Products:** The newly approved Shop Owner can now access the Seller Dashboard to upload images, descriptions, and prices for their local items.
6. **Customer Purchase:** Travelers visiting the Marketplace can view approved products, add them to their cart, and purchase authentic local goods.

### **Flow Diagram:**
```text
[Standard User] 
      │
      ▼
[Submit Shop Application] ──► (shopApplicationStatus: 'pending')
      │
      ▼
[Marketplace Admin] ──► Reviews Application
      │
      ├──► (Rejected) ──► User cannot sell items
      │
      └──► (Approved) ──► Status updated to 'approved'
                                  │
                                  ▼
[Seller Dashboard] ──► Shop Owner lists Local Products / Items
                                  │
                                  ▼
[TripQuest Marketplace] ──► Travelers can view and buy items
```

---

## 💡 Summary for your Project Report

If you are presenting this, emphasize that TripQuest uses a **Role-Based Access Control (RBAC)** system. This means:

*   **Standard Users:** Can explore, chat with the AI, read reviews, join experiences, and buy from the marketplace.
*   **Hosts (Approved):** Can create and manage Local Experiences.
*   **Sellers/Shop Owners (Approved):** Can list and sell items in the Marketplace.
*   **Admins:** Have the authority to approve or reject applications, ensuring high quality and authenticity across the platform.
