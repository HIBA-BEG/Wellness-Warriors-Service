export const DEMO_ORGANIZER = {
  email: 'organizer@wellnesswarriors.demo',
  password: 'OrganizerDemo123!',
  firstName: 'Demo',
  lastName: 'Organizer',
  gender: 'woman',
  picture: 'profiles/organizer.png',
};

export const PARTICIPANT_PASSWORD = 'ParticipantDemo123!';

const roster = [
  ['Amina', 'Bennani', 'woman'],
  ['Sara', 'Idrissi', 'woman'],
  ['Leila', 'Chraibi', 'woman'],
  ['Fatima Zahra', 'El Fassi', 'woman'],
  ['Khadija', 'Berrada', 'woman'],
  ['Nadia', 'Alaoui', 'woman'],
  ['Salma', 'Benkirane', 'woman'],
  ['Houda', 'Tazi', 'woman'],
  ['Imane', 'Ouazzani', 'woman'],
  ['Rim', 'Bennis', 'woman'],
  ['Zineb', 'Cherkaoui', 'woman'],
  ['Meryem', 'Lahlou', 'woman'],
  ['Asmae', 'Benjelloun', 'woman'],
  ['Hajar', 'Squalli', 'woman'],
  ['Soukaina', 'Amrani', 'woman'],
  ['Youssef', 'El Amrani', 'man'],
  ['Omar', 'Tazi', 'man'],
  ['Karim', 'Benjelloun', 'man'],
  ['Mehdi', 'Chraibi', 'man'],
  ['Anas', 'Bennani', 'man'],
  ['Hamza', 'Idrissi', 'man'],
  ['Adam', 'El Fassi', 'man'],
  ['Rayan', 'Alaoui', 'man'],
  ['Bilal', 'Berrada', 'man'],
  ['Ismail', 'Ouazzani', 'man'],
  ['Nabil', 'Cherkaoui', 'man'],
  ['Tarik', 'Lahlou', 'man'],
  ['Reda', 'Benkirane', 'man'],
  ['Amine', 'Squalli', 'man'],
  ['Saad', 'Bennis', 'man'],
] as const;

function emailFor(firstName: string, lastName: string) {
  const local = `${firstName}.${lastName}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');
  return `${local}@wellnesswarriors.demo`;
}

export const DEMO_PARTICIPANTS = roster.map(
  ([firstName, lastName, gender], index) => {
    const id = String(index + 1).padStart(2, '0');
    return {
      firstName,
      lastName,
      gender,
      email: emailFor(firstName, lastName),
      picture: `profiles/p${id}.png`,
    };
  },
);

function attendees(start: number, count: number) {
  return Array.from({ length: count }, (_, offset) => {
    const person =
      DEMO_PARTICIPANTS[(start + offset) % DEMO_PARTICIPANTS.length];
    return person.email;
  });
}

export const DEMO_EVENTS = [
  {
    title: 'Community Sports Morning in Agadir',
    description:
      'Relays and a short circuit on the sand, then a cool-down walk along the promenade. Water was set out at the halfway cone.',
    location: 'Beach Promenade, Agadir',
    dayOffset: -40,
    startHour: 9,
    endHour: 11,
    status: 'completed',
    poster: 'events/e01.jpg',
    participants: attendees(15, 8),
  },
  {
    title: 'Dawn Meditation in Chefchaouen',
    description:
      'A quiet hour beside Ras El Maa before the lanes filled up. The group sat for breath work, then walked back through the blue streets.',
    location: 'Ras El Maa, Chefchaouen',
    dayOffset: -33,
    startHour: 6,
    endHour: 8,
    status: 'completed',
    poster: 'events/e02.jpg',
    participants: attendees(0, 6),
  },
  {
    title: 'Atlas Trail Walk in Ifrane',
    description:
      'An easy loop under the cedars with two stops for water and a stretch. The pace stayed conversational the whole way.',
    location: 'Cedar Forest, Ifrane',
    dayOffset: -26,
    startHour: 8,
    endHour: 11,
    status: 'completed',
    poster: 'events/e03.jpg',
    participants: attendees(4, 7),
  },
  {
    title: 'Hammam Recovery Circle in Fes',
    description:
      'A recovery afternoon after a training week: steam, a guided stretch, and tea in the courtyard of the riad.',
    location: 'Riad Medina, Fes',
    dayOffset: -21,
    startHour: 16,
    endHour: 18,
    status: 'completed',
    poster: 'events/e04.jpg',
    participants: attendees(8, 6),
  },
  {
    title: 'Beach Volleyball Warmup in Essaouira',
    description:
      'Light games on Tagharte beach, with a shoulder warmup first and a swim for anyone who wanted one after the last set.',
    location: 'Tagharte Beach, Essaouira',
    dayOffset: -16,
    startHour: 10,
    endHour: 12,
    status: 'completed',
    poster: 'events/e05.jpg',
    participants: attendees(16, 8),
  },
  {
    title: 'Friday Mobility Lab in Rabat',
    description:
      'Hips, shoulders, and a short strength finisher on the lawns of Agdal. Mats and bands were provided.',
    location: 'Agdal Gardens, Rabat',
    dayOffset: -9,
    startHour: 18,
    endHour: 19,
    status: 'completed',
    poster: 'events/e06.jpg',
    participants: attendees(2, 8),
  },
  {
    title: 'Bouregreg Night Run in Sale',
    description:
      'A 5 km loop across the Hassan II bridge and back along the river path. The group split into a jog and a brisk walk.',
    location: 'Hassan II Bridge, Sale',
    dayOffset: -5,
    startHour: 19,
    endHour: 21,
    status: 'completed',
    poster: 'events/e07.jpg',
    participants: attendees(18, 7),
  },
  {
    title: 'Prenatal Stretch in Casablanca',
    description:
      'A gentle class for late pregnancy: side-lying stretches, breathing, and a short rest. Partners were welcome on the floor beside the mats.',
    location: 'Ain Diab Studio, Casablanca',
    dayOffset: -2,
    startHour: 11,
    endHour: 12,
    status: 'completed',
    poster: 'events/e08.jpg',
    participants: attendees(1, 5),
  },
  {
    title: 'Morning Yoga in Rabat',
    description:
      'Sunrise flow on the lawns of Chellah. The hour covers breath work, a slow sequence, and a short meditation by the ramparts. Arrive 15 minutes early.',
    location: 'Chellah Gardens, Rabat',
    dayOffset: 7,
    startHour: 8,
    endHour: 10,
    status: 'scheduled',
    poster: 'events/e09.jpg',
    participants: attendees(0, 8),
  },
  {
    title: 'Coastal Run in Casablanca',
    description:
      'A relaxed 5 km along the Ain Diab corniche. The pace stays conversational, with a water stop halfway and a stretch circle at the finish.',
    location: 'Ain Diab Corniche, Casablanca',
    dayOffset: 10,
    startHour: 7,
    endHour: 9,
    status: 'scheduled',
    poster: 'events/e10.jpg',
    participants: attendees(15, 8),
  },
  {
    title: 'Wellness Workshop in Marrakech',
    description:
      'An afternoon on breathing, mobility, and recovery after training. There is a short talk, partner stretching, and a routine to take home.',
    location: 'Jardin Majorelle, Marrakech',
    dayOffset: 14,
    startHour: 15,
    endHour: 18,
    status: 'scheduled',
    poster: 'events/e11.jpg',
    participants: attendees(3, 10),
  },
  {
    title: 'Rainout Hike in Akchour',
    description:
      'The bridge walk was called off after the river rose. The date stays on the calendar so members can see the cancellation.',
    location: 'Akchour Bridge, Chefchaouen',
    dayOffset: 12,
    startHour: 9,
    endHour: 13,
    status: 'cancelled',
    poster: 'events/e12.jpg',
    participants: attendees(6, 6),
  },
  {
    title: 'Sunset Stretch in Tangier',
    description:
      'A golden-hour mobility class overlooking the Strait. Expect hip openers, shoulder work, and a quiet finish as the light drops. Bring a light layer.',
    location: 'Cap Spartel, Tangier',
    dayOffset: 18,
    startHour: 17,
    endHour: 19,
    status: 'scheduled',
    poster: 'events/e13.jpg',
    participants: attendees(7, 7),
  },
  {
    title: 'Desert Breathwork in Merzouga',
    description:
      'A late-afternoon session on the edge of Erg Chebbi. The practice is seated breathing, then a short walk back before dusk.',
    location: 'Erg Chebbi, Merzouga',
    dayOffset: 22,
    startHour: 16,
    endHour: 18,
    status: 'scheduled',
    poster: 'events/e14.jpg',
    participants: attendees(9, 6),
  },
  {
    title: 'Poolside Recovery in Agadir',
    description:
      'Easy laps, a mobility circuit on the deck, and fruit afterwards. This is a recovery day, not a race.',
    location: 'Agadir Marina, Agadir',
    dayOffset: 26,
    startHour: 9,
    endHour: 11,
    status: 'scheduled',
    poster: 'events/e15.jpg',
    participants: attendees(12, 8),
  },
  {
    title: 'Saturday Strength Circuit in Sale',
    description:
      'Six stations in Bouknadel Gardens: squats, carries, a short run, and a stretch to close. Beginners can scale every station.',
    location: 'Bouknadel Gardens, Sale',
    dayOffset: 30,
    startHour: 9,
    endHour: 11,
    status: 'scheduled',
    poster: 'events/e16.jpg',
    participants: attendees(17, 9),
  },
  {
    title: 'Palmeraie Family Walk in Marrakech',
    description:
      'A shaded walk among the palms with a playground stop halfway. Children are welcome, and the pace follows the slowest walker.',
    location: 'Palmeraie, Marrakech',
    dayOffset: 35,
    startHour: 10,
    endHour: 12,
    status: 'scheduled',
    poster: 'events/e17.jpg',
    participants: attendees(1, 8),
  },
  {
    title: 'Open-Water Prep in El Jadida',
    description:
      'A shoreline swim briefing, then a short parallel swim inside the flagged area for anyone who is comfortable in open water.',
    location: 'Sidi Bouzid Beach, El Jadida',
    dayOffset: 40,
    startHour: 8,
    endHour: 10,
    status: 'scheduled',
    poster: 'events/e18.jpg',
    participants: attendees(20, 6),
  },
  {
    title: 'Sunrise Flow in Asilah',
    description:
      'A slow vinyasa on the ramparts as the tide goes out. Mats are provided. The class ends with tea at the Portuguese walls.',
    location: 'Ramparts, Asilah',
    dayOffset: 47,
    startHour: 7,
    endHour: 9,
    status: 'scheduled',
    poster: 'events/e19.jpg',
    participants: attendees(5, 8),
  },
  {
    title: 'City Night Cycle in Rabat',
    description:
      'The night ride down Avenue Mohammed V was cancelled after the city closed the route for roadworks.',
    location: 'Avenue Mohammed V, Rabat',
    dayOffset: -12,
    startHour: 20,
    endHour: 22,
    status: 'cancelled',
    poster: 'events/e20.jpg',
    participants: attendees(19, 7),
  },
];
