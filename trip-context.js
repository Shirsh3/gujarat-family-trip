/** Shared structured trip facts for UI and AI (CommonJS + browser). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TripContext = factory();
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  const TRIP_CONTEXT = {
    title: "Gujarat Family Yatra",
    period: { start: "2026-12-28", end: "2027-01-03", label: "28 December 2026 – 3 January 2027" },
    group: { adults: 6, toddlers: 1, label: "6 adults and 1 toddler" },
    route: ["Jamnagar", "Dwarka", "Somnath", "Diu", "Porbandar"],
    hotels: [
      {
        name: "Hotel Laxmi Niwas",
        area: "Anand Chowk, Dwarka, Gujarat",
        checkIn: "2026-12-29",
        checkOut: "2026-12-31",
        nights: 2,
        rooms: 2,
        disambiguation: "Do not confuse with other Hotel Laxmi properties near Bhadrakali Chowk or elsewhere in Dwarka.",
      },
      {
        name: "Hotel Sukhnath",
        area: "Somnath, Gujarat",
        checkIn: "2026-12-31",
        checkOut: "2027-01-01",
        nights: 1,
        rooms: 2,
      },
      {
        name: "Hotel Ankur",
        area: "Diu",
        checkIn: "2027-01-01",
        checkOut: "2027-01-02",
        nights: 1,
        rooms: 2,
      },
    ],
    transportNotes: [
      "Jamnagar arrival is scheduled 29 December at 5:25 AM; pickup must be coordinated against actual arrival because delays are possible.",
      "Intercity legs Jamnagar→Dwarka, Dwarka→Somnath, Somnath→Diu and Diu→Porbandar are planned as road journeys.",
      "Bet Dwarka requires a ferry transfer; ferry time is not included in road routing estimates.",
      "Vehicle selection is a plan only — do not claim a cab is booked.",
    ],
    jaipurRetiringRooms: {
      date: "2027-01-03",
      window: "2 PM–8 PM",
      rooms: "Two confirmed AC rooms at Jaipur Railway Station (Double AC + Maharaja Suite AC)",
      totalInr: 1728,
      note: "Do not reveal voucher, passenger or booking identifiers.",
    },
    indicativeCosts: {
      hotelsInrPlus: 19838,
      transportTargetInr: "28000-30000",
      jaipurRetiringRoomsInr: 1728,
      knownSubtotalLabel: "₹49,566–51,566+",
      note: "Planning subtotal only; excludes train fares, food, tolls, parking, local transport and other expenses. Not final trip cost.",
    },
  };

  function asPromptBlock() {
    return [
      "STRUCTURED TRIP CONTEXT (source of truth — do not invent conflicting dates or hotels):",
      JSON.stringify(TRIP_CONTEXT, null, 2),
    ].join("\n");
  }

  return { TRIP_CONTEXT, asPromptBlock };
});
