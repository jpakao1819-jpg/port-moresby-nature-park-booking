/**
 * Port Moresby Nature Park - Interactive Client Application
 * Clean, lightweight vanilla JavaScript following modern web standards.
 */

// Prices in Papua New Guinea Kina (PGK)
const TICKET_PRICES = {
  adult: 15.00,
  child: 10.00,
  student: 12.00,
  tourist: 35.00
};

// Animal / Flora Data for Interactive Showcase
const WILDLIFE_DATA = {
  'tree-kangaroo': {
    common: "Goodfellow’s Tree Kangaroo",
    scientific: "Dendrolagus goodfellowi",
    image: "https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?auto=format&fit=crop&w=700&q=80",
    status: "Endangered (IUCN Red List)",
    habitat: "Montane Mid-Altitude Rainforests of PNG",
    bio: "Goodfellow’s tree kangaroos are arboreal marsupials adapted for life high in the dense rainforest canopies of Papua New Guinea. Unlike ground kangaroos, their forelimbs are muscular and flexible with long, curved claws for climbing trees. Port Moresby Nature Park maintains a world-leading captive breeding and research program to ensure their survival."
  },
  'raggiana': {
    common: "Raggiana Bird of Paradise",
    scientific: "Paradisaea raggiana",
    image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=700&q=80",
    status: "Protected National Emblem of PNG",
    habitat: "Primary & Secondary Tropical Lowland Forests",
    bio: "The Kumul, or Raggiana Bird of Paradise, is the national emblem of Papua New Guinea proudly featured on our national flag. Males boast magnificent fiery orange-red flank plumes used in elaborate courtship dances on specialized display trees (leks). Our walk-through rainforest aviary lets visitors observe their mesmerizing calls and courtship flights."
  },
  'cassowary': {
    common: "Southern Cassowary",
    scientific: "Casuarius casuarius",
    image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=700&q=80",
    status: "Vulnerable Keystone Species",
    habitat: "Tropical Dense Rainforests",
    bio: "The Southern Cassowary is one of the heaviest and most primitive living birds on Earth. With a striking keratinous casque atop its head and vivid cobalt-blue neck skin, this majestic flightless bird plays a vital ecological role by dispersing the large seeds of over 200 native rainforest tree species that cannot pass through any other animal."
  },
  'crowned-pigeon': {
    common: "Victoria Crowned Pigeon",
    scientific: "Goura victoria",
    image: "https://images.unsplash.com/photo-1588636166442-f9024f2b1d03?auto=format&fit=crop&w=700&q=80",
    status: "Vulnerable Native Bird",
    habitat: "Lowland Sago & Alluvial Forests",
    bio: "Named in honor of Queen Victoria, this is officially the largest pigeon species in the world, growing to the size of a female turkey. Recognized by its steel-blue plumage, bright maroon breast, and spectacular fan-shaped crest of lace-tipped feathers. They mate for life and feed peacefully along the forest floor."
  },
  'orchids': {
    common: "National Orchid Collection",
    scientific: "Orchidaceae (Dendrobium & Bulbophyllum)",
    image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=700&q=80",
    status: "3,000+ Endemic PNG Species",
    habitat: "Highland Mist Forests to Coastal Mangroves",
    bio: "Papua New Guinea is globally recognized as the orchid capital of our planet, holding over 60% of all known species. The Nature Park houses PNG's premier living botanical repository, featuring vibrant epiphytic Dendrobiums, delicate slipper orchids, and rare endemic hybrids nurtured by certified horticultural botanists."
  },
  'tree-python': {
    common: "Papuan Green Tree Python",
    scientific: "Morelia viridis",
    image: "https://images.unsplash.com/photo-1531386151447-fd7640330a37?auto=format&fit=crop&w=700&q=80",
    status: "Protected Native Reptile",
    habitat: "Canopy Vines & Tropical Branches",
    bio: "Famous for its unique resting posture—coiled in a neat saddle arrangement over horizontal branches with its head resting in the center. Juveniles are born either brilliant canary yellow or brick red, undergoing a miraculous ontogenetic color shift into vivid emerald green as they reach maturity."
  }
};

// Global App State & Controller
const app = {
  bookingModal: null,
  wildlifeModal: null,

  init() {
    this.bookingModal = document.getElementById('bookingModal');
    this.wildlifeModal = document.getElementById('wildlifeModal');

    this.initAdmissionCalculator();
    this.initWildlifeFilters();
    this.initWildlifeDetailsModal();
    this.initModals();
    this.initParkStatus();
    this.initMobileMenu();
    this.initBookingForm();
  },

  // 1. Admission Calculator
  initAdmissionCalculator() {
    const qtyInputs = {
      adult: document.getElementById('qtyAdult'),
      child: document.getElementById('qtyChild'),
      student: document.getElementById('qtyStudent'),
      tourist: document.getElementById('qtyTourist')
    };

    const totalDisplay = document.getElementById('totalAmountDisplay');

    const recalculate = () => {
      const adultCount = parseInt(qtyInputs.adult.value, 10) || 0;
      const childCount = parseInt(qtyInputs.child.value, 10) || 0;
      const studentCount = parseInt(qtyInputs.student.value, 10) || 0;
      const touristCount = parseInt(qtyInputs.tourist.value, 10) || 0;

      const total = (adultCount * TICKET_PRICES.adult) +
                    (childCount * TICKET_PRICES.child) +
                    (studentCount * TICKET_PRICES.student) +
                    (touristCount * TICKET_PRICES.tourist);

      totalDisplay.textContent = `K${total.toFixed(2)}`;
    };

    // Button event listeners
    document.querySelectorAll('.btn-qty').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = btn.getAttribute('data-type');
        const action = btn.getAttribute('data-action');
        const input = qtyInputs[type];

        if (!input) return;

        let val = parseInt(input.value, 10) || 0;
        if (action === 'inc') {
          val = Math.min(50, val + 1);
        } else if (action === 'dec') {
          val = Math.max(0, val - 1);
        }
        input.value = val;
        recalculate();
      });
    });

    const bookCalcBtn = document.getElementById('btnBookFromCalc');
    if (bookCalcBtn) {
      bookCalcBtn.addEventListener('click', () => {
        const adults = qtyInputs.adult.value;
        const kids = qtyInputs.child.value;
        const students = qtyInputs.student.value;
        const tourists = qtyInputs.tourist.value;
        const total = totalDisplay.textContent;

        const summary = `General Admission Tickets (${adults} Adults, ${kids} Kids, ${students} Students, ${tourists} Tourists - Total: ${total})`;
        this.openBooking(summary);
      });
    }

    recalculate();
  },

  // 2. Wildlife Filter Tabs
  initWildlifeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.wildlife-card');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        cards.forEach(card => {
          if (filter === 'all') {
            card.style.display = 'flex';
          } else {
            const categories = card.getAttribute('data-category') || '';
            if (categories.includes(filter)) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          }
        });
      });
    });
  },

  // 3. Wildlife Details Modal
  initWildlifeDetailsModal() {
    document.querySelectorAll('.card-link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-animal');
        const data = WILDLIFE_DATA[key];
        if (!data) return;

        document.getElementById('wildlifeScientific').textContent = data.scientific;
        document.getElementById('wildlifeCommon').textContent = data.common;
        document.getElementById('wildlifeModalImg').src = data.image;
        document.getElementById('wildlifeModalImg').alt = data.common;
        document.getElementById('wildlifeModalBio').textContent = data.bio;
        document.getElementById('wildlifeStatusText').textContent = data.status;
        document.getElementById('wildlifeHabitatText').textContent = data.habitat;

        if (this.wildlifeModal && typeof this.wildlifeModal.showModal === 'function') {
          this.wildlifeModal.showModal();
        }
      });
    });

    const closeBtn = document.getElementById('wildlifeCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.wildlifeModal) this.wildlifeModal.close();
      });
    }

    // Dismiss on backdrop click
    if (this.wildlifeModal) {
      this.wildlifeModal.addEventListener('click', (e) => {
        const rect = this.wildlifeModal.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          this.wildlifeModal.close();
        }
      });
    }
  },

  // 4. Modals Controller
  initModals() {
    const openBtns = [
      document.getElementById('btnOpenTickets'),
      document.getElementById('btnOpenExcursion'),
      document.getElementById('heroBtnBooking'),
      document.getElementById('btnBookSchoolPromo'),
      document.getElementById('mBtnTickets'),
      document.getElementById('mBtnExcursion')
    ];

    openBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          const isSchool = btn.id.includes('Excursion') || btn.id.includes('School');
          this.openBooking(isSchool ? 'School Group Excursion' : 'General Admission Tickets');
        });
      }
    });

    const closeBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.bookingModal.close());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.bookingModal.close());

    if (this.bookingModal) {
      this.bookingModal.addEventListener('click', (e) => {
        const rect = this.bookingModal.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          this.bookingModal.close();
        }
      });
    }
  },

  openBooking(preselectTitle = '') {
    if (!this.bookingModal) return;

    const modalTitle = document.getElementById('modalTitle');
    const select = document.getElementById('bookingType');

    if (preselectTitle) {
      modalTitle.textContent = `Reservation: ${preselectTitle}`;
      if (preselectTitle.toLowerCase().includes('school')) {
        select.value = 'School Group Excursion';
      } else if (preselectTitle.toLowerCase().includes('membership')) {
        select.value = '2026 Membership Pass Application';
      } else if (preselectTitle.toLowerCase().includes('venue')) {
        select.value = 'Garden Venue Hire / Private Event';
      } else {
        select.value = 'General Admission Tickets';
      }
    } else {
      modalTitle.textContent = 'Online Booking & Reservation';
    }

    // Set default date to tomorrow
    const visitDateInput = document.getElementById('visitDate');
    if (visitDateInput && !visitDateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      visitDateInput.value = tomorrow.toISOString().split('T')[0];
    }

    if (typeof this.bookingModal.showModal === 'function') {
      this.bookingModal.showModal();
    }
  },

  // 5. Booking Form Submission -> Prepares Direct WhatsApp Message
  initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const type = document.getElementById('bookingType').value;
      const name = document.getElementById('fullName').value;
      const phone = document.getElementById('phoneNumber').value;
      const email = document.getElementById('emailAddress').value;
      const date = document.getElementById('visitDate').value;
      const count = document.getElementById('visitorCount').value;
      const school = document.getElementById('schoolName').value;
      const notes = document.getElementById('specialRequests').value;

      // Construct pre-filled WhatsApp message
      const text = `🌿 *New Nature Park Reservation Inquiry*%0A%0A` +
                   `• *Type:* ${encodeURIComponent(type)}%0A` +
                   `• *Name:* ${encodeURIComponent(name)}%0A` +
                   `• *Phone:* ${encodeURIComponent(phone)}%0A` +
                   `• *Email:* ${encodeURIComponent(email || 'Not provided')}%0A` +
                   `• *Visit Date:* ${encodeURIComponent(date)}%0A` +
                   `• *Guests/Students:* ${encodeURIComponent(count)}%0A` +
                   (school ? `• *Organization/School:* ${encodeURIComponent(school)}%0A` : '') +
                   (notes ? `• *Special Notes:* ${encodeURIComponent(notes)}%0A` : '');

      const waUrl = `https://wa.me/67572301805?text=${text}`;

      // Close modal and open WhatsApp
      this.bookingModal.close();
      window.open(waUrl, '_blank');

      alert(`Thank you, ${name}! Your inquiry for ${date} has been formatted. Click 'Send' in WhatsApp or SMS to connect immediately with our park desk.`);
    });
  },

  // 6. Park Status (PNG Time Zone UTC+10)
  initParkStatus() {
    const statusText = document.getElementById('parkStatusText');
    if (!statusText) return;

    // PNG is UTC+10
    const now = new Date();
    const utcHours = now.getUTCHours();
    const pngHour = (utcHours + 10) % 24;

    // Park hours: 8:30 AM to 4:30 PM (8.5 to 16.5)
    if (pngHour >= 8 && pngHour < 16) {
      statusText.textContent = `Open Now • Closes at 4:30 PM (PNG Time)`;
    } else {
      statusText.textContent = `Park Opens at 8:30 AM Tomorrow`;
    }
  },

  // 7. Mobile Menu Drawer
  initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const drawer = document.getElementById('mobileDrawer');
    const close = document.getElementById('mobileDrawerClose');
    const links = document.querySelectorAll('.mobile-nav-links .m-link');

    if (!toggle || !drawer) return;

    const openDrawer = () => {
      drawer.classList.add('open');
      drawer.removeAttribute('inert');
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('inert', '');
    };

    toggle.addEventListener('click', openDrawer);
    if (close) close.addEventListener('click', closeDrawer);

    links.forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
