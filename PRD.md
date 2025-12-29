# Product Requirements Document: Project Krishak

## 1. Project Overview**Project Name:** Krishak **Goal:** A web-based platform connecting farmers, buyers, and transporters to ensure fair pricing and efficient supply chain management.
**Target Audience:** Farmers, Buyers (Wholesale/Retail), Transporters, Admins.

##2. Technical Stack ***Language:** JavaScript ***Frontend:** React.js, TailwindCSS
***Backend:** Node.js, Express.js 
***Database:** MongoDB with Mongoose ORM
***Deployment:** Vercel 

## 3. User Roles & Modules

###Module 1: Account & Listing Management 
* **Authentication:**
    * Sign up/Login with Phone/Email & Password.
    * Google Sign-in support.
    *Role selection required at signup (Farmer / Buyer / Transporter / Admin).
* **Profiles:**
    *Update Name, Phone, Address, District.
    ***Farmers:** Add Farm Details (Location, Crops).
    ***Buyers:** Add Delivery Addresses.
* **Listings (Farmer):**
    * Create listing with: Crop Name, Grade, Available Quantity (kg), Location (Village/Thana), Harvest Date, Minimum Order Quantity (MOQ).
    *Upload Quality Photos.
* **Moderation (Admin):**
    *Approve or Reject listings/photos for authenticity.

###Module 2: Pricing, Calculator & Orders 
* **Market Intelligence:**
    *Display Real-time Wholesale vs. Retail prices per district.
    *Show 30-day Price History Charts.
* **Fair-Price Calculator:**
    * Inputs: Seed, Fertilizer, Labor, Transport costs.
    *Output: Suggested "Fair Selling Price".
    *Buyer View: Comparison of Wholesale vs. Retail vs. "You Pay" vs. Farmer Earnings.
* **Ordering:**
    * **Pre-orders:** Select Harvest Window + Quantity.Secure price band & payment.
    ***Regular Orders:** Add to Cart, Select Delivery Slot, or "Order by Map" interface.

###Module 3: Delivery, Quality & After-Sales 
* **Logistics (Transporter):**
    * View Delivery Jobs within a radius.
    *Status Workflow: Assigned → Picked → In-Transit → Delivered.
    *Live Status visibility for Buyer/Farmer.
* **Quality Assurance:**
    * Mandatory Photo at Pickup (Transporter).
    *Optional Photo at Delivery.
* **Notifications:**
    *In-app & SMS alerts for Price Changes, Order Updates, Assignments.
* **Reviews:**
    *Bi-directional rating (Farmer ↔ Buyer) on Product Quality, Communication, Delivery.