<style>
  @media print {
    @page {
      size: A4;
      margin: 18mm 16mm;
    }
    .no-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .page-break {
      page-break-before: always;
    }
    img {
      max-height: 360px !important;
      width: auto !important;
      display: block;
      margin: 0 auto;
    }
  }
  .image-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    margin: 15px 0;
  }
  .image-box {
    flex: 1 1 45%;
    max-width: 48%;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
    box-sizing: border-box;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .image-box img {
    max-width: 100%;
    max-height: 340px;
    border-radius: 4px;
    object-fit: contain;
  }
  .image-caption {
    font-size: 12px;
    font-weight: 600;
    margin-top: 6px;
    color: #475569;
  }
</style>

28.10.2026  
# Prototyping Document - Yurtify Application

---

### Prototyping Summary:
This document presents the systematic evaluation, usability verification, and iterative interface refinements conducted for **Yurtify**, an integrated operations and resident engagement platform designed for private university student dormitories. Building directly upon the empirical problem statements established during the user interview phase, a comprehensive, mobile-first interactive prototype was constructed and evaluated. The testing cohort comprised 6 resident students and 2 operational administrators from Karahan Higher Education Female Student Dormitory.

The evaluation focused on verifying end-to-end operational workflows: resident onboarding and authentication, the native dual-theme framework (Light and Dark modes), daily meal schedule distribution, the resident-demanded administrative announcements feed, fair-use laundry slot reservations with quota tracking, and transparent maintenance request lifecycles. All findings, critical user feedback, and proposed architectural improvements are detailed systematically below.

---

### Prototype Visual Architecture:

<div class="image-grid no-break">

  <div class="image-box">
    <!-- Buraya resminizin dosya yolunu yazın, örn: <img src="screenshots/signup.png" /> -->
    <img src="https://via.placeholder.com/300x550.png?text=Sign+Up+%26+Log+In" alt="Sign Up and Log In Screens" />
    <div class="image-caption">Sign Up and Log In Screens</div>
  </div>

  <div class="image-box">
    <!-- Buraya resminizin dosya yolunu yazın -->
    <img src="https://via.placeholder.com/300x550.png?text=Home+Screen" alt="Resident Home Screen" />
    <div class="image-caption">Resident Home Screen: Meals & Announcements</div>
  </div>

  <div class="image-box">
    <!-- Buraya resminizin dosya yolunu yazın -->
    <img src="https://via.placeholder.com/300x550.png?text=Laundry+Scheduling" alt="Laundry Scheduling" />
    <div class="image-caption">Laundry Scheduling & Quota Tracking</div>
  </div>

  <div class="image-box">
    <!-- Buraya resminizin dosya yolunu yazın -->
    <img src="https://via.placeholder.com/300x550.png?text=Maintenance+Report" alt="Maintenance Ticket Reporting" />
    <div class="image-caption">Maintenance Ticket Reporting</div>
  </div>

  <div class="image-box" style="flex: 1 1 100%; max-width: 98%;">
    <!-- Buraya resminizin dosya yolunu yazın -->
    <img src="https://via.placeholder.com/600x320.png?text=Administrative+Control+Panel" alt="Admin Control Panel" />
    <div class="image-caption">Administrative Control Panel: Meal Menu & Maintenance Management</div>
  </div>

</div>

---

<div class="no-break">

### 1. User Authentication and Account Registration
**Questions:**
* How intuitive is the account creation and credential validation process for newly enrolled dormitory residents?
* Does the registration schema capture essential institutional fields (Full Name, Student ID / TR Identity, Room Number, and Institutional Email) without causing cognitive friction?
* Is the credential recovery mechanism clearly designated for residents experiencing authentication errors?

**Feedback:**
* Participants evaluated the onboarding interface favorably, noting that restricting mandatory input fields to strictly essential parameters minimized account creation time.
* Both student participants and dormitory administrators appreciated including the "Room Number" attribute directly within the sign-up workflow, which facilitates immediate client-side and server-side room mapping.
* Users recommended implementing inline input validation alerts (e.g., verifying standard email syntax and room number ranges) before submitting credentials to mitigate failed registration attempts.

</div>

---

<div class="no-break">

### 2. General Experience, Navigation, and Dual-Theme Architecture
**Questions:**
* What is your overall assessment of the mobile dashboard hierarchy, touch targets, and persistent bottom navigation?
* How effectively does the dual-theme engine (high-contrast Light Mode and low-glare Dark Mode) accommodate ambient lighting variations across study rooms and dorm halls?
* Are institutional metrics—such as check-in/curfew regulations and operational badges—readily distinguishable?

**Feedback:**
* The interface was commended for its clean, modular card layout and responsive bottom navigation, enabling residents to access all operational services within two taps.
* The pre-existing dual-theme implementation received decisive positive feedback: Dark Mode was heavily preferred for late-night mobile interactions within shared dorm rooms to prevent visual fatigue, whereas Light Mode provided optimal legibility in daylight environments.
* Participants suggested adding an automated "System Synchronized" theme setting that detects and adopts the native operating system theme (iOS/Android) alongside the manual toggle controls.

</div>

---

<div class="no-break">

### 3. Daily Dining Schedules and Administrative Announcements Feed
**Questions:**
* How clearly do the designated breakfast and dinner meal cards convey daily menu components alongside official service windows (07:30–08:30 and 18:00–19:00)?
* Does the integrated Announcements Board—incorporated into the core architecture directly following user interview demands—resolve previous communication bottlenecks?
* Are the dynamic service state tags (e.g., "Active Hot Service", "Completed") easy to interpret?

**Feedback:**
* Residents confirmed that displaying daily menus in distinct, time-stamped cards successfully eliminates mealtime uncertainty and redundant verbal inquiries to cafeteria staff.
* The centralized Announcements Board received outstanding feedback; residents noted that publishing official curfew reminders, gate operational policies, and boiler/heating timetables directly on the home view effectively replaces disorganized WhatsApp group chats and easily overlooked paper notices.
* While general menu updates are actively visible, participants specifically requested high-priority push notification banners and visual "Recently Updated" indicator tags whenever the administration publishes an unexpected menu alteration or urgent facility notice.

</div>

---

<div class="no-break">

### 4. Laundry Facility Reservation and Machine Quota Enforcement
**Questions:**
* Is the time-slot scheduling flow (selecting Washer 1, Washer 2, Tumble Dryer, date, and 1.5-hour operating blocks) user-friendly and transparent?
* How clearly do individual machine status cards convey personal booking slots and weekly quota limits (e.g., 2 washes per resident)?
* Are automated reservation confirmation and cancellation actions intuitive enough to prevent scheduling conflicts?

**Feedback:**
* Participants strongly approved of the explicit classification of washing versus drying units and confirmed that the visible weekly allocation limit prevents slot monopolization by individual residents.
* While individual machine reservations and personal schedule monitoring performed reliably, student participants highlighted an informational gap: the tested prototype only allowed checking availability slot-by-slot rather than offering an aggregate, bird's-eye occupancy overview of the laundry facility.
* Consequently, residents explicitly requested top-level facility occupancy metrics (such as percentage-based capacity indicators and quick summaries of currently running vs. idle units for washing and drying) to assess laundry room congestion before initiating a reservation.
* Building upon the baseline booking notifications, users reiterated their demand for refined timing alerts: specifically, an automated push notification dispatched **10 minutes prior to a scheduled reservation** to ensure punctuality, and an urgent warning dispatched **10 minutes before cycle completion** prompting prompt machine unloading.

</div>

---

<div class="no-break">

### 5. Maintenance Defect Reporting and Administrative Work-Order Tracking
**Questions:**
* Does the standardized category taxonomy (Plumbing, Electrical, Wi-Fi, Furniture, Structural) adequately cover routine dormitory maintenance issues?
* How effective are the three-tier visual status progression badges ("Open", "Under Review", "Resolved") in establishing operational accountability?
* Does the administrative overview simplify assigning and progressing work orders for facilities staff?

**Feedback:**
* Residents verified that submitting defect tickets through structured categorical dropdowns drastically reduces reporting latency compared to verbal front-desk requests.
* The color-coded progression badges provided reassuring visibility, confirming that submitted tickets were acknowledged and dispatched to relevant technicians.
* Administrative staff commended the single-tap state progression feature, while recommending two enhancements: an optional photographic evidence attachment field for residents, and a mutual confirmation prompt before an open maintenance ticket is finalized as resolved.

</div>

---

### Suggested Improvements

#### 1. Authentication and General Experience:
* **a.** Implement client-side inline validation for institutional email and room number syntax during registration.
* **b.** Introduce an automatic "Match System Theme" setting in addition to the manual Light and Dark mode selectors.

#### 2. Dining Management and Announcements:
* **a.** Deploy high-priority push notification banners for urgent administrative announcements (e.g., unplanned water/power outages or modified curfew rules).
* **b.** Display a prominent "Updated Just Now" visual tag on dining cards whenever meal compositions or service intervals are revised.

#### 3. Laundry Operations and Granular Alerting:
* **a.** Implement real-time aggregate occupancy indicators (percentage gauges and active/idle unit status counts) for washing and drying segments on the student laundry screen.
* **b.** Implement an automated push reminder dispatched exactly 10 minutes prior to the start of a reserved laundry block.
* **c.** Trigger an automated 10-minute pre-completion warning notification prompting residents to retrieve garments and free the unit for subsequent queue members.
* **d.** Add a simple one-tap "Release Machine Early" feature for cycles completed ahead of schedule.

#### 4. Maintenance and Facility Administration:
* **a.** Provide an optional photographic upload field within the resident maintenance ticket creation form.
* **b.** Incorporate a bilateral resolution verification mechanism allowing residents to confirm satisfactory repair completion prior to ticket archival.

---

### Appendix: Prototyping Audio Recordings and Evaluation Records
The digital audio recordings, evaluation logs, and usability test session transcripts conducted with university students and operational staff for the Yurtify Application are archived and accessible via the secure institutional repository link below:

`[Insert Google Drive Link Here: Prototyping Audio Recordings & Verification Files]`
