# Project Charter
**SENG211 Software Project Management • AYBU Software Engineering**

---

### Project Information
* **Project Name:** Dormitory Management System and Student Portal (DMS)
* **Prepared By:** Zeynep Lermi, Anna Demkiv
* **Project Sponsor / Client:** Özel Ankara Karahan Yükseköğrenim Kız Öğrenci Yurdu
* **Estimated Budget:** 0 TL (Volunteer Engineering Student Project)
* **Project Timeline:** 4 Weeks (01.11.2026 – 01.12.2026)

---

### DESCRIPTION
This project aims to develop a responsive web application for Özel Ankara Karahan Yükseköğrenim Kız Öğrenci Yurdu. The system provides a unified digital platform where students and dormitory staff can manage meal menu viewing, laundry room time-slot appointments, and room maintenance fault tracking without relying on manual paperwork, physical sign-up lists, or in-person queues.

---

### CUSTOMER PROBLEM
Currently, the dormitory coordinates daily operational routines through manual, paper-based, and verbal processes, leading to recurring bottlenecks:
* **Meal Menu Tracking:** Daily meal lists are posted on bulletin boards or shared through messaging groups, causing communication gaps and missed updates when schedules change.
* **Laundry Room Conflicts:** Reservations rely on manual sign-up sheets, leading to forgotten appointments, idle washing/drying machines during reserved times, and booking disputes among students.
* **Maintenance Delays:** Room issues (plumbing, electrical, furniture repairs) are reported verbally, resulting in untracked requests and no real-time status visibility for residents.
* **Administrative Burden:** Dormitory personnel spend significant manual time fielding repetitive inquiries instead of focusing on core facility operations.

---

### PURPOSE
* Publish weekly and monthly dining hall menus in real time on an accessible web interface.
* Automate laundry reservations with conflict-free slot scheduling to eliminate machine idle time and prevent double bookings.
* Establish a transparent fault-ticketing pipeline where students submit categorized repair requests and administrators update progress status (*Pending* → *Resolved*).
* Provide dedicated, role-separated portals for resident students and administrative staff with secure authentication.

---

### REQUIREMENTS
* **User Authentication & Roles:** Role-based access control with encrypted logins for students and dormitory staff.
* **Meal Menu Module:** Admin interface to create and update daily/weekly menus; student view to display schedules by date.
* **Laundry Appointment System:** Machine catalog (washers/dryers), time-slot booking, automatic conflict blocking, and cancellation handling.
* **Maintenance Fault Reporting:** Categorized repair requests (plumbing, electrical, furniture) with live progress tracking.
* **Responsive Design:** Clean layouts compatible with mobile smartphone screens and desktop web browsers.

---

### SCOPE
* User authentication and role-based access control
* Daily and weekly meal menu publishing module
* Laundry machine time-slot scheduling engine
* Maintenance ticketing and administrative status tracking
* Administrative oversight and management dashboard
* Comprehensive user and administrator documentation

---

### CONSTRAINTS
* **Time:** The project must be completed and deployed within 4 weeks (01.11.2026 – 01.12.2026).
* **Budget:** 0 TL (The project is developed by a volunteer student team and requires no financial fee).

\newpage

# Project Plan & Formal Endorsement
**Milestone Schedule, Governance & Official Approval**

---

### HIGH-LEVEL MILESTONE SCHEDULE

| Week | Description | Milestone |
| :--- | :--- | :--- |
| **Week 1**<br>(01.11 – 07.11.2026) | Project initiation; charter sign-off; baseline data collection (rooms, machines); requirements gathering and database schema design. | **Project Initiation** |
| **Week 2**<br>(08.11 – 14.11.2026) | Database deployment; user authentication setup; development of Meal Menu module and initial UI layouts. | **Core Infrastructure** |
| **Week 3**<br>(15.11 – 21.11.2026) | Implementation of Laundry Appointment engine (conflict prevention logic) and Maintenance Fault Reporting module; Beta build delivery. | **Feature Development & MVP** |
| **Week 4**<br>(22.11 – 01.12.2026) | System integration; pilot user testing with staff; bug fixes; live deployment; user manual handover and project closure. | **Testing & Closure** |

---

### SUCCESS CRITERIA
* 0% double-booking errors during concurrent laundry reservation tests.
* Successful sign-off on User Acceptance Testing (UAT) by the dormitory administration.
* Over 80% positive feedback rating in student usability evaluations during pilot usage.
* Full delivery and live deployment of the functional application within the defined 4-week timeline and 0 TL budget.

---

### RISKS & MITIGATION
* **Scope Creep:** Any requests for out-of-scope features (e.g., student payment collection) will be deferred to post-course phases.
* **Data Delays:** Pre-formatted data templates for room and machine inventories will be supplied to dormitory staff during Week 1.
* **User Hesitation:** An illustrated user guide will be provided to resident students to facilitate smooth digital onboarding.
* **Technical Roadblocks:** Dedicated buffer days are allocated prior to final deployment to resolve unforeseen edge-case bugs.

---

### STAKEHOLDERS
* **Project Sponsor:** Aybüke Karahan (Dormitory Manager, Özel Ankara Karahan Kız Öğrenci Yurdu)
* **Project Team:** Zeynep Lermi & Anna Demkiv (Project Managers & Lead Developers)
* **End Users:** Resident students and dormitory administrative/maintenance personnel

---

### PROJECT MANAGERS' RESPONSIBILITIES & AUTHORITIES
The project is co-managed by Zeynep Lermi and Anna Demkiv, who are responsible for planning, executing, architecture design, and milestone reporting.
1. **Task Allocation:** Define work packages and allocate tasks across frontend, backend, and testing.
2. **Technical Decision Making:** Approve the technology stack, software architecture, and database schemas.
3. **Schedule Control:** Adjust internal development schedules to ensure adherence to milestones.
4. **Scope Enforcement:** Maintain defined project boundaries and manage change requests.
5. **Client Liaison:** Lead stakeholder communication, progress reviews, and pilot evaluations.

---

### FORMAL DECLARATION OF SPONSOR'S SUPPORT
I, Aybüke KARAHAN, as the Dormitory Manager of Özel Ankara Karahan Yükseköğrenim Kız Öğrenci Yurdu, hereby approve and endorse the Dormitory Management System and Student Portal (DMS) project. I declare that I will provide the necessary institutional support (room lists, machine inventories, and pilot testing access) for its successful completion. The project is developed by a volunteer student team and requires no financial fee.

**Estimated Budget:** 0 TL (Volunteer Engineering Student Project) | **Date:** 01.11.2026

| Project Sponsor | Project Managers & Lead Developers |
| :--- | :--- |
| **Name Surname:** Aybüke KARAHAN | **Name Surname:** Zeynep LERMİ |
| **Title:** Dormitory Manager | |
| **Signature:** _________________________ | **Signature:** _________________________ |
