# Raahi Project Report Draft

This draft is based on the current codebase in this repository and aligned to the structure in `Report_Format__2025_26.pdf`.

Important notes:
- Replace all placeholder text such as team names, mentor name, screenshots, and GitHub link with your official details.
- Testing results below are written as a report-ready draft based on implemented features. I did not execute the full system end-to-end because runtime environment values such as MongoDB and notification credentials are not configured in this workspace.
- A few points in this report are explicitly marked as inferred where the code suggests the design but no written documentation exists.

---

## Title Suggestion

**Raahi: A Multi-Tenant Smart Transport Tracking and Safety Management System**

Alternative title:

**Raahi: Web-Based Transport Management, Live Bus Tracking, and Passenger Safety Platform**

---

## Cover Page Details

Project Mentor: `[Fill mentor name and designation]`  
Submitted By: `[Fill team member names and roll numbers]`  
Department: Information Technology  
Institute: Swami Keshvanand Institute of Technology, M & G, Jaipur  
Session: 2025-2026

---

## Certificate

Use the college template exactly as provided in the PDF. Fill:
- Student names
- Semester
- Project title
- Mentor name and designation
- Coordinator name and designation

---

## Declaration

We hereby declare that the project report entitled **"Raahi: A Multi-Tenant Smart Transport Tracking and Safety Management System"** is a record of original work carried out by us under the guidance of our project mentor in the Department of Information Technology, Swami Keshvanand Institute of Technology, Management and Gramothan, Jaipur. This project has been developed as partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Information Technology. To the best of our knowledge, this work has not been submitted elsewhere for the award of any other degree or diploma.

Team Members: `[Fill names and roll numbers]`

---

## Acknowledgement

We express our sincere gratitude to our project mentor for continuous guidance, motivation, and valuable suggestions throughout the development of this project. Their technical insights and constant encouragement helped us shape the idea into a practical and functional system.

We are also thankful to the project coordinator, Head of Department, and all faculty members of the Department of Information Technology, SKIT Jaipur, for providing the academic environment and institutional support required for completing this work successfully.

We would also like to thank our friends, classmates, and family members for their support, feedback, and encouragement during the design, implementation, testing, and documentation phases of the project.

Finally, we acknowledge all open-source communities and documentation resources that helped us understand and implement the technologies used in this project.

---

## Abstract

Raahi is a web-based smart transport management and passenger safety platform designed to improve the efficiency, transparency, and security of institutional and city transport operations. The system provides role-based access for organization administrators, passengers, drivers, super administrators, and city passengers. It enables transport administrators to manage buses, routes, stops, drivers, and passengers from a centralized dashboard. Drivers can share live GPS location through their device, and passengers can track their assigned bus in real time through an interactive interface.

The platform also includes safety-oriented features such as SOS alerts, passenger issue reporting, guardian notification support, and route-level monitoring. A multi-tenant architecture is used so that each organization can securely operate within its own transport context using organization-specific codes and plan limits. The platform supports subscription-based scaling with trial, basic, pro, and enterprise plans, each enforcing usage limits on buses, passengers, and routes.

In addition to institution-focused transport management, Raahi includes a city passenger module where users can create accounts, search journeys between stops, detect nearest stops using geospatial queries, and select matching buses. The system is implemented using React, Vite, Express.js, MongoDB, Mongoose, Axios, and Leaflet. Raahi demonstrates how modern web technologies can be used to build a practical, scalable, and safety-focused transport solution for educational institutions and urban mobility scenarios.

---

# Chapter 1: Introduction

## 1.1 Problem Statement and Objective

Transportation management in colleges, schools, and urban passenger systems is often handled manually or through fragmented tools. This creates multiple operational issues such as poor route visibility, difficulty in assigning buses to passengers, inefficient communication between transport administrators and users, lack of real-time tracking, and delayed response in emergencies. In many cases, parents or guardians do not know the live location of the bus carrying their ward, and transport administrators have limited tools to monitor trip execution, route occupancy, or incident reporting.

The absence of an integrated system becomes even more problematic when the organization manages multiple buses, routes, drivers, and passengers. Manual record keeping makes the system error-prone, difficult to scale, and inefficient during urgent situations such as missed stops, overcrowding, or medical emergencies.

The objective of Raahi is to solve these problems by providing:
- centralized transport management for organizations
- real-time bus tracking for passengers
- route and stop management for administrators
- driver-side live location sharing
- SOS and issue reporting for safety
- multi-tenant support for multiple organizations
- subscription-aware scaling for different transport sizes
- city passenger journey assistance with nearest stop and route matching

The major objective is to build a reliable and scalable digital platform that improves safety, transparency, and operational control in transport systems.

## 1.2 Literature Survey / Market Survey / Investigation and Analysis

The idea behind Raahi is inspired by problems observed in institutional transport systems and by trends in smart mobility platforms. Existing market solutions generally focus on one or two areas such as GPS tracking, route assignment, student attendance, or bus fleet monitoring. However, many solutions either lack affordability for small institutions, do not support organization-level isolation, or fail to combine safety, tracking, and administrative workflows into one unified platform.

The investigation of the problem domain showed the following common requirements:
- institutions need an easy interface for adding passengers, buses, drivers, and routes
- passengers need a simple way to see bus progress and estimated arrival
- guardians need fast notification during emergencies
- drivers need a lightweight interface to share location without complex setup
- system owners need organization-level separation and plan-based scaling
- city mobility users need nearest-stop and route discovery capabilities

Based on code analysis, Raahi addresses these needs through a modular web platform rather than a single-purpose tracking application. It combines transport administration, live GPS-based monitoring, emergency alerting, issue escalation, and route intelligence in one system.

## 1.3 Introduction to Project

Raahi is a full-stack web application designed for smart transport administration and passenger safety. The frontend is built using React and Vite, while the backend is built using Express.js and MongoDB. The system supports multiple types of users:
- organization admin
- student or regular passenger
- driver
- platform super admin
- city super admin
- city passenger

The organization admin manages the transport ecosystem of a particular institution by creating passengers, buses, routes, and drivers. The driver shares live location using browser/device geolocation, and passengers track the bus through a map-based interface. Passengers can also raise emergency SOS alerts and submit issue reports. Super administrators can create organizations and manage stop and city route catalogs. City passengers can create accounts, search journeys, identify nearby stops, and select active buses serving their route.

The system follows a multi-tenant approach where organization-specific context is determined through an organization code. This allows the same backend to serve multiple institutions while keeping their transport data logically separated.

## 1.4 Proposed Logic / Algorithm / Business Plan / Solution

Raahi uses the following core logic:

1. **Multi-tenant organization isolation**
   The backend reads an organization code or organization ID from request context and binds all resource operations to that organization.

2. **Subscription plan enforcement**
   Before creating a bus, passenger, or route, the backend counts current records for the organization and checks limits based on plan type such as trial, basic, pro, or enterprise.

3. **Automatic passenger-route-bus mapping**
   When a student passenger is added, the system finds the route matching the passenger stop and automatically assigns the related running bus.

4. **Live GPS tracking**
   The driver device periodically sends latitude and longitude to the backend. The passenger-side interface fetches the latest location and displays it on a map.

5. **Emergency notification workflow**
   On SOS trigger, the system stores the event and attempts to notify the guardian through email, SMS, and WhatsApp depending on configured services.

6. **City journey matching**
   For city passengers, the system uses stop-name normalization, text scoring, and fuzzy matching to map source and destination stops to the most relevant active route and bus.

7. **Nearest stop detection**
   The system uses geospatial stop data and MongoDB near queries to identify the closest active stops around the passenger location.

8. **Issue reporting**
   A passenger can report issues like wrong stop, crowding, or assistance requirement along with current location data.

**Inferred business idea:** The codebase suggests that Raahi can be positioned as a transport SaaS platform for schools, colleges, and city mobility use cases with subscription-based plans and centralized super-admin management.

## 1.5 Scope of the Project

The scope of Raahi includes:
- institutional transport digitization
- passenger registration and assignment
- bus, driver, route, and stop management
- real-time bus tracking
- issue reporting and emergency escalation
- multi-organization platform administration
- city passenger assistance and ride discovery
- plan-based scaling for different organization sizes

The current scope does not fully include:
- payment integration
- native mobile application
- biometric attendance
- biometric attendance
- full production-grade authentication using JWT or OAuth
- predictive maintenance or traffic-based rerouting

Therefore, the project is a strong functional prototype and transport management platform with clear room for future expansion.

---

# Chapter 2: Software Requirement Specification

## 2.1 Overall Description

Raahi is a web-based transport management and safety information system. It allows educational institutions and transport operators to manage daily mobility through a centralized dashboard and role-specific workflows. It supports admin, passenger, driver, and super-admin usage scenarios. The system is intended to work in environments where buses, routes, and stops must be managed centrally while still providing end users with live tracking and emergency support features.

### 2.1.1 Product Perspective

Raahi is a modular client-server application. The frontend provides dashboards and user interaction screens. The backend exposes REST APIs for data management, location updates, alerts, and reporting. MongoDB is used for persistence, and external services such as SMTP and Twilio are used for notifications.

#### 2.1.1.1 System Interfaces

The major system interfaces are:
- React frontend interacting with backend APIs through Axios
- Express backend connected to MongoDB through Mongoose
- driver browser/device geolocation interface for sending live location
- Leaflet/OpenStreetMap map interface for location visualization
- SMTP interface for guardian email alerts
- Twilio interface for SMS and WhatsApp alerts

#### 2.1.1.2 User Interfaces

The system provides multiple user interfaces:
- access selector page for choosing user role
- organization admin dashboard with tabs for students, SOS alerts, reports, analytics, buses, routes, and drivers
- passenger tracking interface with map, ETA, route timeline, quick report buttons, and SOS control
- driver dashboard for selecting bus and starting or stopping live trip sharing
- super admin dashboard for organization creation, plan view, stop management, and city route management
- city super admin dashboard for city stop and city route administration
- city passenger flow for account creation, login, journey search, nearest stop suggestion, and ride selection

#### 2.1.1.3 Hardware Interfaces

Hardware dependencies include:
- server or cloud machine to host backend and database connection
- laptop or desktop for admin usage
- smartphone or GPS-enabled device for driver location sharing
- passenger phone or browser-enabled device for live tracking
- stable internet connection for continuous communication

#### 2.1.1.4 Software Interfaces

The software stack includes:
- frontend: React, Vite, Axios, Leaflet
- backend: Node.js, Express.js, Mongoose
- database: MongoDB
- notifications: Nodemailer, Twilio
- browser APIs: Geolocation API, Local Storage

#### 2.1.1.5 Communications Interfaces

Communication is handled using:
- HTTP/HTTPS requests between frontend and backend
- REST API endpoints returning JSON
- geolocation updates from driver device to backend
- email communication through SMTP
- SMS and WhatsApp communication through Twilio
- map tile requests to OpenStreetMap/CARTO services

#### 2.1.1.6 Memory Constraints

The system is a web application and does not require heavy memory at the client side under normal usage. The backend mainly stores structured transport records, logs, reports, SOS events, and geolocation points. Practical storage growth is driven by:
- frequent location updates
- accumulated SOS and report logs
- stop and route catalogs

The current backend contains cleanup logic that removes SOS and report records older than one year, which helps control long-term storage growth.

#### 2.1.1.7 Operations

The operational sequence of the platform is:
- create organization and define plan
- create stops and routes
- add buses and drivers
- assign buses to routes and drivers
- add passengers and auto-map them to routes/buses
- driver starts location sharing during trip
- passenger tracks bus in real time
- passenger reports issues or triggers SOS when needed
- admin monitors alerts, reports, and analytics

#### 2.1.1.8 Project Functions

Major project functions are:
- organization registration and status control
- subscription limit checking
- passenger CRUD operations
- guardian data management
- bus CRUD and route assignment
- route creation and deletion
- driver creation and bus assignment
- GPS location logging and live location retrieval
- SOS event generation and guardian notification
- issue reporting with location
- admin analytics and alert monitoring
- city passenger account creation and login
- journey search and nearest stop suggestion
- super admin management of organizations, stops, and city routes

#### 2.1.1.9 User Characteristics

Expected users include:
- transport admin with basic computer literacy
- driver with smartphone/browser access
- student or employee passenger with minimal technical knowledge
- platform super admin with authority over multiple organizations
- city passenger seeking route guidance

The interface is designed to keep actions direct and role-specific so that non-technical users can operate the system with limited training.

#### 2.1.1.10 Constraints

The main constraints are:
- internet dependency for live tracking and notifications
- GPS permission required on driver devices
- live notification depends on valid SMTP/Twilio credentials
- organization context must be supplied for organization-scoped APIs
- current authentication is lightweight and based on role input, organization code, and admin keys rather than full token-based identity management
- passenger map route visualization is partially simulated from stop count in the current frontend implementation, while bus position is fetched from actual GPS updates

#### 2.1.1.11 Assumption and Dependencies

Assumptions:
- each organization has its own buses, passengers, routes, and drivers
- organization code is known by valid users
- driver device can continuously access location services
- MongoDB connection and environment variables are properly configured
- active routes and buses are maintained by admin users

Dependencies:
- Node.js runtime
- MongoDB database
- React and Vite build environment
- external notification services
- browser geolocation support

---

# Chapter 3: System Design Specification

## 3.1 System Architecture

Raahi follows a client-server architecture with modular separation between presentation, business logic, and data layers.

### Architectural Layers

1. **Presentation Layer**
   Built using React. It includes admin dashboards, passenger tracking UI, driver tracking UI, and super-admin panels.

2. **Application Layer**
   Built using Express.js. It handles routing, validation, organization context resolution, plan checks, passenger assignment, live tracking, SOS, and issue reporting.

3. **Data Layer**
   Built using MongoDB and Mongoose. It stores organizations, passengers, guardians, buses, routes, stops, location logs, drivers, SOS records, reports, and city passenger accounts.

4. **External Service Layer**
   Includes SMTP for email alerts, Twilio for SMS/WhatsApp, and map tile services for visualization.

### Architectural Summary

- Frontend sends role-specific requests to backend APIs.
- Backend identifies organization context and applies business logic.
- MongoDB stores all transactional and master data.
- Drivers update live coordinates.
- Passengers fetch live coordinates and visualize the route.
- Emergency workflows trigger guardian notifications through external services.

## 3.2 Module Decomposition Description

The project is decomposed into the following modules:

### 1. Access and Role Selection Module
- lets user choose organization admin, super admin, driver, or city passenger flow
- validates organization code or admin key

### 2. Organization and Subscription Module
- registers organizations
- resolves organization by code
- activates/deactivates organizations
- exposes plan catalog and usage information
- enforces plan limits on buses, passengers, and routes

### 3. Passenger Management Module
- add, update, search, and delete passengers
- manage guardian information
- auto-link passenger with route and running bus using stop name

### 4. Bus Management Module
- add buses
- categorize buses as institution or city
- assign routes to buses
- view available buses and status

### 5. Route Management Module 
- create routes with start point, end point, and intermediate stops
- add stops to routes
- delete routes and unlink dependent records

### 6. Driver Management Module
- create drivers
- assign drivers to buses
- maintain one driver to one bus mapping within organization

### 7. Live Tracking Module
- driver shares location using geolocation API
- backend stores location logs
- passenger UI fetches latest bus location
- map interface shows live bus marker and route progress

### 8. SOS and Reporting Module
- creates SOS records
- creates issue reports with category and location
- fetches alert history for admin
- sends guardian notifications via email/SMS/WhatsApp

### 9. Analytics Module
- counts active passengers, active buses, and routes
- groups passenger distribution by route and bus

### 10. Stop and City Transport Module
- manages stop catalog with geospatial coordinates
- supports nearest-stop query
- supports city passenger account creation and login
- supports city journey search and route matching

### 11. Super Admin Module
- manages organizations across platform
- manages common stops and city routes
- controls organization status and subscription visibility

## 3.3 High Level Design Diagrams

Below is report-ready content for each required diagram. You can draw these in draw.io, Lucidchart, StarUML, Visio, or PlantUML.

### 3.3.1 Use Case Diagram

**Actors:**
- Super Admin
- City Super Admin
- Organization Admin
- Driver
- Passenger
- City Passenger
- Guardian

**Main use cases:**
- Create organization
- View plans and usage
- Activate or deactivate organization
- Manage stops
- Manage city routes
- Add passenger
- Manage buses
- Manage routes
- Manage drivers
- Start trip and share location
- Track bus
- Trigger SOS
- Report issue
- Search city journey
- Find nearest stop
- Receive guardian notification

### 3.3.2 Activity Diagram

Suggested activity flow:
- user selects role
- system validates organization code or key
- role-based dashboard is opened
- admin configures passengers, buses, routes, and drivers
- driver starts trip and shares location
- passenger opens live tracking
- passenger views ETA and bus progress
- passenger optionally reports issue or triggers SOS
- admin monitors alerts and reports

### 3.3.3 Data-Flow Diagram

**External entities:**
- Admin
- Driver
- Passenger
- Guardian
- Super Admin

**Processes:**
- authentication and role selection
- organization context handling
- transport management
- live tracking
- emergency processing
- reporting and analytics

**Data stores:**
- organization database
- route/bus/passenger database
- location log store
- SOS store
- report store
- city passenger account store

### 3.3.4 E-R Diagram

Use the following relationships:
- Organization `1:N` Passenger
- Organization `1:N` Bus
- Organization `1:N` Route
- Organization `1:N` Driver
- Organization `1:N` Stop
- Passenger `1:1` Guardian
- Passenger `N:1` Bus
- Passenger `N:1` Route
- Driver `1:1` Assigned Bus
- Bus `N:1` Route
- Bus `1:N` LocationLog
- Passenger `1:N` SOS
- Passenger `1:N` Report
- Passenger `1:1` CityPassengerAccount

### 3.3.5 Class Diagram

Important classes/entities to show:
- Organization
- Passenger
- Guardian
- Bus
- Route
- Driver
- Stop
- LocationLog
- SOS
- Report
- CityPassengerAccount
- CityStop
- CityRoute

Mention key attributes such as:
- Organization: name, code, plan, status, subscriptionEndsAt
- Passenger: name, rollNo, phone, stopName, destinationStop, status
- Bus: busNumber, type, route, driver, status
- Route: routeName, startPoint, endPoint, stops
- Driver: name, phone, driverCode, licenseNumber, assignedBus
- Stop: name, city, aliases, location
- SOS: passengerId, busId, latitude, longitude, time
- Report: category, message, latitude, longitude, reportedAt

### 3.3.6 Communication Diagram

Draw object-level interactions such as:
- Passenger UI -> Backend API -> LocationLog DB
- Driver UI -> Backend API -> LocationLog DB
- Passenger UI -> Backend API -> SOS/Report DB -> Notification Service -> Guardian
- Admin UI -> Backend API -> Passenger/Bus/Route collections

### 3.3.7 Sequence Diagram

Recommended sequence: **SOS workflow**

1. Passenger clicks SOS
2. Frontend sends SOS request with passenger ID and coordinates
3. Backend validates passenger and guardian
4. Backend stores SOS event
5. Backend builds location link
6. Backend sends email/SMS/WhatsApp if configured
7. Guardian receives notification
8. Admin later views SOS history

Recommended alternate sequence: **driver live tracking**

1. Driver selects bus
2. Driver starts trip
3. Browser geolocation fetches coordinates
4. Frontend posts coordinates to backend
5. Backend stores LocationLog
6. Passenger frontend polls live location
7. Map updates current bus marker

### 3.3.8 Component Diagram

Components to include:
- React Frontend
- Access Selector
- Admin Dashboard
- Passenger Tracking UI
- Driver Tracking UI
- Super Admin UI
- Express API Server
- Organization Service
- Passenger Service
- Route Service
- Bus Service
- Driver Service
- Tracking Service
- SOS and Reporting Service
- MongoDB
- SMTP Service
- Twilio Service
- OpenStreetMap/CARTO Tile Service

### 3.3.9 Deployment Diagram

Deployment nodes:
- Admin Laptop / Browser
- Passenger Mobile / Browser
- Driver Smartphone / Browser
- Web Server hosting frontend
- Node.js backend server
- MongoDB database server
- External email and messaging gateways

### 3.3.10 Business Process Model

Business process:
- platform admin creates organization
- organization admin configures routes, stops, buses, drivers, passengers
- passengers are linked to appropriate transport resources
- drivers start trips and provide location feed
- passengers monitor trip progress
- emergency or issue events are recorded and escalated
- admin uses analytics and notifications for decision making

---

# Chapter 4: Methodology and Team

## 4.1 Introduction to Process Model

The development of Raahi can be explained using the **Waterfall model with iterative refinement**. The college format asks for Waterfall, and the project can be presented under that model because the work progressed through recognizable phases of requirement collection, design, implementation, testing, and documentation.

### Requirement Analysis

At the beginning of the project, the team identified the transport problems to be addressed:
- lack of centralized transport administration
- no live bus tracking for passengers
- poor emergency response visibility
- need for multi-organization support
- city passenger route guidance requirement

### System Design

After identifying requirements, the team designed:
- role-based workflows
- database schema for transport entities
- admin and passenger dashboards
- route and stop structures
- SOS and reporting flows

### Implementation

The project was implemented in two main parts:
- React frontend for dashboards and tracking interfaces
- Express and MongoDB backend for APIs, storage, and business logic

### Integration and Testing

The frontend and backend were integrated through REST APIs. Functional modules such as passenger management, driver tracking, live location fetch, and SOS/report flows were connected and validated at the application level.

### Deployment and Maintenance

The codebase is structured for local development and deployment through configurable environment variables. Since the platform is modular, new features such as authentication, payments, and predictive ETA can be added in future versions.

## 4.2 Team Members, Roles and Responsibilities

Replace with your actual official team details. Suggested format:

- Team Member 1 - Frontend development, UI integration, passenger tracking interface
- Team Member 2 - Backend API development, database schema design, live tracking and SOS module
- Team Member 3 - Admin dashboard, super admin module, testing, documentation
- Team Member 4 - City passenger flow, analytics module, report writing, deployment support

If your team has only three members, keep only three entries.

---

# Chapter 5: Centering System Testing

## Testing Note

The following testing content is prepared from implemented functionality in the codebase. Final pass/fail status should be updated after your final demo run using tools such as Chrome browser, Postman, MongoDB Atlas/local MongoDB, and browser developer tools.

## 5.1 Functionality Testing

Functionality testing was focused on verifying whether each major module behaves according to user requirements. The following areas were considered:

- role-based access validation for admin, driver, passenger, super admin, and city passenger
- organization resolution using organization code
- passenger CRUD operations
- guardian data saving and updating
- route creation, stop addition, and route deletion
- bus creation and route assignment
- driver creation and bus assignment
- live location update and fetch cycle
- SOS record generation and guardian notification trigger
- passenger issue report generation
- analytics computation from passenger, route, and bus data
- city passenger account creation and PIN login
- nearest stop search using geospatial query
- journey search and route selection for city passengers
- plan-limit enforcement for buses, passengers, and routes

### Unit Testing

At unit level, major logic areas include:
- stop-name normalization and route matching
- plan-limit checking
- organization context resolution
- fuzzy stop matching for city passenger search
- geospatial nearest stop selection

### Integration Testing

Integration testing focused on:
- frontend to backend API communication
- backend to MongoDB data persistence
- driver geolocation to location log pipeline
- SOS/report trigger to backend event storage
- organization header to data filtering behavior

### System Testing

System testing was considered across full workflows:
- admin onboarding transport setup
- driver trip start and location sharing
- passenger tracking and event reporting
- super admin organization management
- city passenger search to journey selection

### User Acceptance Testing

UAT can be presented around these scenarios:
- admin can manage all core transport records from one dashboard
- driver can share live location with minimal steps
- passenger can identify bus context and raise SOS quickly
- super admin can manage multiple organizations centrally
- city passenger can discover nearby stops and available routes

## 5.2 Performance Testing

Performance testing for Raahi is centered on practical application responsiveness rather than high-volume enterprise load. Based on the current design, the following aspects are relevant:

- dashboard modules should load passenger, bus, and route data within acceptable time for normal institutional datasets
- live location fetch should update every 5 seconds without freezing the passenger interface
- driver location sharing should send periodic updates with low delay
- SOS and report submission should complete quickly because they are safety-sensitive actions
- organization usage count and plan limit checks should remain efficient because they are simple database count operations

**Inferred observation from code design:** the current system is suitable for prototype and small-to-medium deployment datasets. Enterprise-scale optimization may later require caching, indexing expansion, log archival strategy, and websocket-based tracking.

## 5.3 Usability Testing

Usability testing focused on simplicity of interaction for different user roles.

Findings that support usability:
- role selection is centralized on the main access page
- admin dashboard uses tab-based navigation for major modules
- passenger tracking screen highlights next stop, ETA, and SOS access prominently
- driver interface keeps the trip-sharing workflow limited to select bus, start trip, and stop trip
- city passenger search keeps the process simple by asking only source, destination, and optional current location

Areas for future usability improvement:
- stronger role-based authentication
- clearer distinction between institution routes and city routes
- more explicit loading and validation indicators
- mobile-first optimization for all admin screens

---

# Chapter 6: Test Execution Summary

## Tool Name(s)

Recommended tools to mention in report:
- Google Chrome
- Postman
- MongoDB Atlas or local MongoDB Compass
- Browser Developer Tools
- Laptop with GPS-enabled mobile device for driver testing

## Test Case Table

Update the final status column after actual execution.

| S.No | Test Case ID | Test Description | Expected Result | Tool / Resources Consumed | Draft Status |
|---|---|---|---|---|---|
| 1 | TC-01 | Create organization with unique code | Organization is created successfully | Super Admin UI, Backend API, MongoDB | To be verified |
| 2 | TC-02 | Create organization with duplicate code | System shows conflict/error | Super Admin UI, Backend API | To be verified |
| 3 | TC-03 | Resolve valid organization code | Organization details are returned | Access UI, Backend API | To be verified |
| 4 | TC-04 | Login as organization admin using valid code | Admin dashboard opens | Browser, Backend API | To be verified |
| 5 | TC-05 | Add passenger with valid stop and guardian | Passenger is created and linked to bus/route | Admin UI, Passenger API, MongoDB | To be verified |
| 6 | TC-06 | Add passenger with invalid stop | System rejects with route not found error | Admin UI, Passenger API | To be verified |
| 7 | TC-07 | Edit passenger details | Passenger and guardian data update successfully | Admin UI, Passenger API | To be verified |
| 8 | TC-08 | Toggle passenger status | Passenger status changes active/inactive | Admin UI, Passenger API | To be verified |
| 9 | TC-09 | Add route with stops | Route is created successfully | Admin UI, Route API | To be verified |
| 10 | TC-10 | Assign bus to route | Bus is linked to selected route | Admin UI, Bus API | To be verified |
| 11 | TC-11 | Add driver and assign bus | Driver is created and linked to one bus | Admin UI, Driver API | To be verified |
| 12 | TC-12 | Driver login with valid driver code | Driver dashboard opens | Browser, Auth API | To be verified |
| 13 | TC-13 | Driver starts trip sharing | Live coordinates are pushed to backend | Driver device, Geolocation API, Backend | To be verified |
| 14 | TC-14 | Passenger tracks assigned bus | Live location is displayed on map | Passenger UI, Location API, Leaflet | To be verified |
| 15 | TC-15 | Passenger triggers SOS | SOS record created and notification attempt made | Passenger UI, SOS API, Email/SMS service | To be verified |
| 16 | TC-16 | Passenger submits quick issue report | Report record is created with category and location | Passenger UI, Report API | To be verified |
| 17 | TC-17 | Admin views SOS alerts | Alert history table loads correctly | Admin UI, SOS API | To be verified |
| 18 | TC-18 | Admin views reported issues | Report history table loads correctly | Admin UI, Report API | To be verified |
| 19 | TC-19 | City passenger finds nearest stops | Nearby active stops are returned | City UI, Stop collection, Geospatial query | To be verified |
| 20 | TC-20 | City passenger searches and selects journey | Matching route/bus options are shown and saved | City UI, Journey API, MongoDB | To be verified |
| 21 | TC-21 | Plan limit reached for trial/basic/pro | System blocks extra creation with plan-limit message | Organization API, plan guard | To be verified |
| 22 | TC-22 | Super admin toggles organization status | Organization becomes active/inactive accordingly | Super Admin UI, Organization API | To be verified |

## Summary Statement

The system test cases cover all primary modules including organization management, transport administration, live tracking, emergency handling, reporting, analytics, and city journey support. The above matrix can be used directly in the final report after updating execution status during final testing.

---

# Chapter 7: Project Screenshots

Insert screenshots of the running system with figure captions. Suggested screenshot set:

1. Main access selection screen  
   Caption: **Figure 7.1: Raahi role selection interface**

2. Organization admin dashboard  
   Caption: **Figure 7.2: Organization admin dashboard**

3. Passenger management module  
   Caption: **Figure 7.3: Passenger management with add/edit operations**

4. Route management module  
   Caption: **Figure 7.4: Route creation and bus assignment**

5. Bus management module  
   Caption: **Figure 7.5: Bus management interface**

6. Driver management module  
   Caption: **Figure 7.6: Driver creation and bus assignment**

7. Driver live tracking screen  
   Caption: **Figure 7.7: Driver trip start and location sharing**

8. Passenger live tracking map  
   Caption: **Figure 7.8: Passenger real-time bus tracking interface**

9. SOS alert panel  
   Caption: **Figure 7.9: Admin view of SOS alerts**

10. Reported issues panel  
    Caption: **Figure 7.10: Admin view of passenger issue reports**

11. Super admin organization panel  
    Caption: **Figure 7.11: Super admin management of organizations and plans**

12. City passenger journey search  
    Caption: **Figure 7.12: City passenger route search and nearest stop suggestions**

---

# Chapter 8: Conclusion and Future Scope

## 8.1 Conclusion

Raahi successfully demonstrates a practical smart transport management and passenger safety system built using modern web technologies. The project integrates multiple transport workflows into a single platform, including organization onboarding, passenger and route management, driver-based live tracking, emergency handling, issue reporting, and city transport assistance. A major strength of the project is its multi-tenant structure, which allows different organizations to use the same platform while preserving separate operational data and enforcing subscription limits.

The project also emphasizes safety and usability. Passengers can monitor bus movement, view route context, submit issue reports, and trigger emergency alerts with location details. Drivers can share location using a simple trip-control interface, and administrators can monitor alerts and manage transport resources from centralized dashboards. Overall, Raahi provides a strong foundation for a scalable transport-tech platform suitable for institutions and expandable to broader mobility environments.

## 8.2 Future Scope

Future enhancements may include:
- JWT-based secure authentication and role authorization
- native Android and iOS mobile applications
- real route polyline generation from actual stop coordinates
- AI-based ETA prediction using traffic and historical trip data
- QR-based passenger boarding and attendance logging
- push notifications for passengers and guardians
- payment and ticketing support for city passengers
- route optimization and dynamic rerouting
- offline caching for weak-network environments
- dashboard export and advanced analytics

---

# Chapter 9: UN Sustainable Development Goals

## 9.1 Mapping with UN Sustainable Development Goals

| S.No | SDG Title | Objective | Outcome Achieved by Raahi |
|---|---|---|---|
| 1 | SDG 3: Good Health and Well-Being | Improve safety and emergency responsiveness | SOS alerts, guardian notification support, and quick issue reporting improve passenger safety |
| 2 | SDG 4: Quality Education | Support safe and dependable access to educational institutions | Institutional transport monitoring improves student commuting reliability |
| 3 | SDG 9: Industry, Innovation and Infrastructure | Encourage smart digital infrastructure | Raahi digitizes transport operations using live tracking, route management, and web-based administration |
| 4 | SDG 11: Sustainable Cities and Communities | Improve urban transport accessibility and efficiency | City passenger journey search and nearest-stop discovery support smarter urban mobility |

### SDG Discussion

Raahi contributes directly to safer and smarter transportation. For institutional users, it strengthens secure access to education by improving travel reliability and communication during transport operations. For city mobility scenarios, it introduces route discovery and stop-level intelligence that can reduce uncertainty and improve transport accessibility. The project therefore aligns well with SDG goals focused on safety, innovation, education access, and sustainable urban systems.

---

# GitHub Link

GitHub Repository Link: `[Insert your GitHub repository URL here]`

---

# References

Use IEEE style in the final report. Suggested references based on technologies used in the project:

[1] React Documentation, "React," Available: https://react.dev/

[2] Express.js Documentation, "Express - Node.js web application framework," Available: https://expressjs.com/

[3] MongoDB Documentation, "MongoDB Manual," Available: https://www.mongodb.com/docs/

[4] Mongoose Documentation, "Mongoose ODM," Available: https://mongoosejs.com/

[5] Leaflet Documentation, "Leaflet - an open-source JavaScript library for interactive maps," Available: https://leafletjs.com/

[6] Twilio Documentation, "Twilio Messaging and WhatsApp API," Available: https://www.twilio.com/docs/

[7] Nodemailer Documentation, "Nodemailer," Available: https://nodemailer.com/

Add 2-3 research-paper references from Google Scholar related to smart transport systems, bus tracking, or passenger safety if your department expects literature references beyond technical documentation.

---

# Appendix: Project-Specific Technical Notes

These points may help during viva or report explanation:

1. The backend is organized as REST APIs under `/api`.
2. Multi-tenancy is implemented through organization context resolved from request headers or codes.
3. Plan limits are enforced when creating buses, passengers, and routes.
4. Driver location updates are stored in `LocationLog` and fetched as latest location for passenger tracking.
5. SOS and report records older than one year are cleaned up automatically in code.
6. The city passenger module supports fuzzy stop matching and nearest stop suggestions.
7. A separate city database connection is defined for `CityStop` and `CityRoute`.
8. The current passenger map shows live bus coordinates, but route path visualization in the frontend is approximated from stop count rather than full geographic route geometry.

---

# Short Viva Summary

If asked to explain the project in 5-6 lines:

Raahi is a multi-tenant smart transport management platform developed for institutions and city mobility scenarios. It allows admins to manage passengers, buses, routes, drivers, and stops from a centralized dashboard. Drivers share live bus location through GPS, and passengers track their bus in real time on a map. The system also supports SOS alerts, issue reporting, and guardian notifications for safety. A super-admin module manages organizations and subscription plans, while a city passenger module helps users find nearby stops and suitable routes.
