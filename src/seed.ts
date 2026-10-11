import 'dotenv/config';
import { copyFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as bcrypt from 'bcryptjs';
import mongoose, { Types } from 'mongoose';
import {
  DEMO_EVENTS,
  DEMO_ORGANIZER,
  DEMO_PARTICIPANTS,
  PARTICIPANT_PASSWORD,
} from './seed-data';

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    isBanned: { type: Boolean, default: false },
    profilePicture: { type: String, default: null },
    gender: String,
    attendingEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    createdEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  },
  { timestamps: true },
);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, unique: true },
    description: String,
    startDate: Date,
    endDate: Date,
    location: String,
    poster: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    status: { type: String, default: 'scheduled' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

function daysFromNow(days: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function publishImage(
  sourceName: string,
  folder: 'uploads' | 'uploads-profile',
  fileName: string,
) {
  const destDir = join(process.cwd(), folder);
  await mkdir(destDir, { recursive: true });
  await copyFile(
    join(process.cwd(), 'seed-images', sourceName),
    join(destDir, fileName),
  );
  return `/${folder}/${fileName}`;
}

async function upsertUser(
  User: mongoose.Model<any>,
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gender: string;
    role: string;
    picture: string;
  },
) {
  const password = await bcrypt.hash(data.password, 10);
  const profilePicture = await publishImage(
    data.picture,
    'uploads-profile',
    `${data.email.split('@')[0].replace(/\./g, '-')}.png`,
  );
  return User.findOneAndUpdate(
    { email: data.email },
    {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password,
      role: data.role,
      gender: data.gender,
      profilePicture,
      isBanned: false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(uri);

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

  const organizer = await upsertUser(User, {
    ...DEMO_ORGANIZER,
    role: 'organizer',
  });

  const participants = [];
  for (const participant of DEMO_PARTICIPANTS) {
    participants.push(
      await upsertUser(User, {
        ...participant,
        password: PARTICIPANT_PASSWORD,
        role: 'participant',
      }),
    );
  }

  const byEmail = Object.fromEntries(
    participants.map((person) => [person.email, person._id]),
  );

  const eventIds: Types.ObjectId[] = [];
  const eventDefinitions = [];
  for (const definition of DEMO_EVENTS) {
    const poster = await publishImage(
      definition.poster,
      'uploads',
      definition.poster.split('/')[1],
    );
    const participantIds = definition.participants.map((email) => byEmail[email]);
    const event = await Event.findOneAndUpdate(
      { title: definition.title },
      {
        title: definition.title,
        description: definition.description,
        location: definition.location,
        startDate: daysFromNow(definition.dayOffset, definition.startHour),
        endDate: daysFromNow(definition.dayOffset, definition.endHour),
        poster,
        organizer: organizer._id,
        participants: participantIds,
        status: definition.status,
        isDeleted: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    eventIds.push(event._id as Types.ObjectId);
    eventDefinitions.push({ ...definition, participantIds });
  }

  const demoTitles = DEMO_EVENTS.map((event) => event.title);
  const demoEmails = DEMO_PARTICIPANTS.map((person) => person.email);
  await Event.deleteMany({ title: { $nin: demoTitles } });
  await User.deleteMany({ role: 'participant', email: { $nin: demoEmails } });

  await User.findByIdAndUpdate(organizer._id, { createdEvents: eventIds });

  const attendance = new Map<string, Types.ObjectId[]>();
  eventDefinitions.forEach((definition, index) => {
    for (const participantId of definition.participantIds) {
      const key = String(participantId);
      const current = attendance.get(key) || [];
      current.push(eventIds[index]);
      attendance.set(key, current);
    }
  });

  for (const participant of participants) {
    await User.findByIdAndUpdate(participant._id, {
      attendingEvents: attendance.get(String(participant._id)) || [],
      createdEvents: [],
    });
  }

  console.log('Demo data is ready.');
  console.log(
    `Organizer: ${DEMO_ORGANIZER.email} / ${DEMO_ORGANIZER.password}`,
  );
  console.log(
    `${DEMO_PARTICIPANTS.length} participants / ${PARTICIPANT_PASSWORD}`,
  );
  console.log(`${DEMO_EVENTS.length} events, with posters and profile pictures.`);
}

seed()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
