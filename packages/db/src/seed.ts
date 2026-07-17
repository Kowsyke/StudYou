import { computeTargetDate } from '@studyou/engine'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import universityData from './data/universities.json'
import {
  categories,
  countries,
  exchangeRates,
  journeyTasks,
  journeys,
  resources,
  stages,
  taskTemplates,
  universities,
  users,
} from './schema'

config({ path: '../../.env' })

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/studyou'

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

const DATA_STAMP = new Date('2026-07-01T00:00:00Z')

// Upserts the operator admin account from environment variables so the
// credential never lives in the repository. Runs even when the main seed
// has already been applied, and does nothing when the variables are unset.
async function ensureEnvAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return

  const { eq } = await import('drizzle-orm')
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  const passwordHash = bcrypt.hashSync(password, 10)

  if (existing) {
    await db.update(users).set({ passwordHash, role: 'admin' }).where(eq(users.id, existing.id))
    console.log(`Admin account refreshed: ${email}`)
  } else {
    await db.insert(users).values({
      email,
      passwordHash,
      fullName: 'StudYou Admin',
      role: 'admin',
    })
    console.log(`Admin account created: ${email}`)
  }
}

// Loads the verified top 100 UK universities dataset (researched from
// official university domains, every domain liveness checked before
// commit). Idempotent: does nothing once the table has rows.
async function ensureUniversities() {
  const [row] = await db.select({ id: universities.id }).from(universities).limit(1)
  if (row) {
    console.log('Universities already seeded.')
    return
  }
  const { eq } = await import('drizzle-orm')
  const [uk] = await db.select({ id: countries.id }).from(countries).where(eq(countries.code, 'GB'))
  if (!uk) {
    console.log('UK country row missing, run the full seed first.')
    return
  }
  await db.insert(universities).values(
    universityData.map((u) => ({
      countryId: uk.id,
      rank: u.rank,
      name: u.name,
      city: u.city,
      region: u.region,
      website: u.website,
      internationalUrl: u.internationalUrl,
      ugAdmissionsUrl: u.ugAdmissionsUrl,
      russellGroup: u.russellGroup,
      notes: u.notes,
      lastUpdated: DATA_STAMP,
    })),
  )
  console.log(`Seeded ${universityData.length} universities.`)
}

async function seed() {
  const existing = await db.select({ id: countries.id }).from(countries).limit(1)
  if (existing.length > 0) {
    console.log('Database already seeded, applying additive steps only.')
    await ensureEnvAdmin()
    await ensureUniversities()
    await client.end()
    return
  }

  console.log('Seeding StudYou database with UK data...')

  const countryRows = await db
    .insert(countries)
    .values([
      { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', isDestination: true },
      { code: 'BD', name: 'Bangladesh', currencyCode: 'BDT' },
      { code: 'IN', name: 'India', currencyCode: 'INR' },
      { code: 'PK', name: 'Pakistan', currencyCode: 'PKR' },
      { code: 'NG', name: 'Nigeria', currencyCode: 'NGN' },
      { code: 'CN', name: 'China', currencyCode: 'CNY' },
      { code: 'LK', name: 'Sri Lanka', currencyCode: 'LKR' },
      { code: 'NP', name: 'Nepal', currencyCode: 'NPR' },
      { code: 'GH', name: 'Ghana', currencyCode: 'GHS' },
      { code: 'US', name: 'United States', currencyCode: 'USD' },
    ])
    .returning()

  const uk = countryRows.find((c) => c.code === 'GB')
  const bangladesh = countryRows.find((c) => c.code === 'BD')
  if (!uk || !bangladesh) throw new Error('Country seed failed')

  const rateSource = 'Static seed rate for development, swap for a live FX feed in production'
  await db.insert(exchangeRates).values([
    { currencyCode: 'BDT', ratePerGbp: '155.0000', source: rateSource, lastUpdated: DATA_STAMP },
    { currencyCode: 'INR', ratePerGbp: '107.0000', source: rateSource, lastUpdated: DATA_STAMP },
    { currencyCode: 'PKR', ratePerGbp: '356.0000', source: rateSource, lastUpdated: DATA_STAMP },
    { currencyCode: 'NGN', ratePerGbp: '1950.0000', source: rateSource, lastUpdated: DATA_STAMP },
    { currencyCode: 'CNY', ratePerGbp: '9.2000', source: rateSource, lastUpdated: DATA_STAMP },
    { currencyCode: 'LKR', ratePerGbp: '380.0000', source: rateSource, lastUpdated: DATA_STAMP },
    { currencyCode: 'NPR', ratePerGbp: '171.0000', source: rateSource, lastUpdated: DATA_STAMP },
    { currencyCode: 'GHS', ratePerGbp: '15.5000', source: rateSource, lastUpdated: DATA_STAMP },
    { currencyCode: 'USD', ratePerGbp: '1.2700', source: rateSource, lastUpdated: DATA_STAMP },
  ])

  const categoryRows = await db
    .insert(categories)
    .values([
      { key: 'visa', label: 'Visa and immigration' },
      { key: 'health', label: 'Health' },
      { key: 'finance', label: 'Finance' },
      { key: 'housing', label: 'Housing' },
      { key: 'documents', label: 'Documents and applications' },
      { key: 'arrival', label: 'Arrival and settling in' },
    ])
    .returning()

  const cat = (key: string) => {
    const row = categoryRows.find((c) => c.key === key)
    if (!row) throw new Error(`Missing category ${key}`)
    return row.id
  }

  const stageRows = await db
    .insert(stages)
    .values([
      {
        countryId: uk.id,
        key: 'prepare',
        title: 'Prepare',
        description: 'English testing, research and paperwork before you apply.',
        orderIndex: 1,
      },
      {
        countryId: uk.id,
        key: 'apply',
        title: 'Apply',
        description: 'Applications, offers and your Confirmation of Acceptance for Studies.',
        orderIndex: 2,
      },
      {
        countryId: uk.id,
        key: 'visa',
        title: 'Visa',
        description: 'Everything the Student visa application requires.',
        orderIndex: 3,
      },
      {
        countryId: uk.id,
        key: 'predeparture',
        title: 'Pre departure',
        description: 'Flights, housing and final packing before you travel.',
        orderIndex: 4,
      },
      {
        countryId: uk.id,
        key: 'arrive',
        title: 'Arrive and settle',
        description: 'Your first weeks in the UK, from enrolment to a bank account.',
        orderIndex: 5,
      },
    ])
    .returning()

  const stage = (key: string) => {
    const row = stageRows.find((s) => s.key === key)
    if (!row) throw new Error(`Missing stage ${key}`)
    return row.id
  }

  const templateRows = await db
    .insert(taskTemplates)
    .values([
      {
        countryId: uk.id,
        stageId: stage('prepare'),
        categoryId: cat('documents'),
        title: 'Book and sit an approved English test',
        description:
          'Most students take IELTS for UKVI Academic. Check whether your university accepts other Secure English Language Tests.',
        costPence: 22900,
        costType: 'mandatory',
        daysBeforeIntake: 300,
        sourceUrl: 'https://ielts.org/take-a-test/booking-your-test',
        lastUpdated: DATA_STAMP,
        orderIndex: 1,
      },
      {
        countryId: uk.id,
        stageId: stage('prepare'),
        categoryId: cat('documents'),
        title: 'Research and shortlist universities',
        description:
          'Compare official course data, outcomes and fees on Discover Uni. You do not need an agency for this.',
        costType: 'none',
        daysBeforeIntake: 330,
        sourceUrl: 'https://www.discoveruni.gov.uk',
        lastUpdated: DATA_STAMP,
        orderIndex: 2,
      },
      {
        countryId: uk.id,
        stageId: stage('prepare'),
        categoryId: cat('documents'),
        title: 'Prepare transcripts, references and personal statement',
        description:
          'Gather certified academic transcripts, arrange referees and draft your personal statement.',
        costType: 'none',
        daysBeforeIntake: 300,
        sourceUrl: 'https://www.ucas.com/undergraduate/applying-university/references',
        lastUpdated: DATA_STAMP,
        orderIndex: 3,
      },
      {
        countryId: uk.id,
        stageId: stage('apply'),
        categoryId: cat('documents'),
        title: 'Submit your UCAS or direct application',
        description: 'The UCAS undergraduate application fee is 28.50 GBP for 2026 entry.',
        costPence: 2850,
        costType: 'mandatory',
        daysBeforeIntake: 240,
        sourceUrl: 'https://www.ucas.com/undergraduate/applying-university',
        lastUpdated: DATA_STAMP,
        orderIndex: 1,
      },
      {
        countryId: uk.id,
        stageId: stage('apply'),
        categoryId: cat('documents'),
        title: 'Receive and accept an offer',
        description: 'Reply to your offers and meet any conditions such as final grades.',
        costType: 'none',
        daysBeforeIntake: 150,
        sourceUrl: 'https://www.ucas.com/undergraduate/after-you-apply',
        lastUpdated: DATA_STAMP,
        orderIndex: 2,
      },
      {
        countryId: uk.id,
        stageId: stage('apply'),
        categoryId: cat('documents'),
        title: 'Pay any tuition deposit and receive your CAS',
        description:
          'Deposit amounts vary by university. Your Confirmation of Acceptance for Studies is issued by the university and is required for the visa.',
        costType: 'none',
        daysBeforeIntake: 120,
        sourceUrl: 'https://www.gov.uk/student-visa',
        lastUpdated: DATA_STAMP,
        orderIndex: 3,
      },
      {
        countryId: uk.id,
        stageId: stage('visa'),
        categoryId: cat('health'),
        title: 'Take a tuberculosis test if your country requires it',
        description:
          'Residents of listed countries need a TB test from an approved clinic. Price varies by country, around 100 GBP.',
        costPence: 10000,
        costType: 'mandatory',
        daysBeforeIntake: 100,
        sourceUrl: 'https://www.gov.uk/tb-test-visa',
        lastUpdated: DATA_STAMP,
        orderIndex: 1,
      },
      {
        countryId: uk.id,
        stageId: stage('visa'),
        categoryId: cat('finance'),
        title: 'Hold your maintenance funds for 28 days',
        description:
          'You must show 1483 GBP per month outside London or 1529 GBP per month in London, for up to nine months, held for 28 consecutive days.',
        costType: 'none',
        daysBeforeIntake: 110,
        sourceUrl: 'https://www.gov.uk/student-visa/money',
        lastUpdated: DATA_STAMP,
        orderIndex: 2,
      },
      {
        countryId: uk.id,
        stageId: stage('visa'),
        categoryId: cat('health'),
        title: 'Pay the Immigration Health Surcharge',
        description:
          'The student rate is 776 GBP per year of your visa. The seeded figure covers one year, multiply by course length.',
        costPence: 77600,
        costType: 'mandatory',
        daysBeforeIntake: 75,
        sourceUrl: 'https://www.gov.uk/healthcare-immigration-application',
        lastUpdated: DATA_STAMP,
        orderIndex: 3,
      },
      {
        countryId: uk.id,
        stageId: stage('visa'),
        categoryId: cat('visa'),
        title: 'Apply for the Student visa',
        description:
          'Applying from outside the UK costs 524 GBP. Apply up to six months before your course.',
        costPence: 52400,
        costType: 'mandatory',
        daysBeforeIntake: 75,
        sourceUrl: 'https://www.gov.uk/student-visa',
        lastUpdated: DATA_STAMP,
        orderIndex: 4,
      },
      {
        countryId: uk.id,
        stageId: stage('visa'),
        categoryId: cat('visa'),
        title: 'Attend your biometrics appointment',
        description: 'Book and attend a visa application centre to give fingerprints and a photo.',
        costType: 'none',
        daysBeforeIntake: 70,
        sourceUrl: 'https://www.gov.uk/find-a-visa-application-centre',
        lastUpdated: DATA_STAMP,
        orderIndex: 5,
      },
      {
        countryId: uk.id,
        stageId: stage('visa'),
        categoryId: cat('visa'),
        title: 'Consider the priority visa service',
        description: 'Optional faster decision, around 500 GBP on top of the standard fee.',
        costPence: 50000,
        costType: 'optional',
        daysBeforeIntake: 70,
        sourceUrl: 'https://www.gov.uk/faster-decision-visa-settlement',
        lastUpdated: DATA_STAMP,
        orderIndex: 6,
      },
      {
        countryId: uk.id,
        stageId: stage('predeparture'),
        categoryId: cat('arrival'),
        title: 'Book your flights',
        description: 'Estimate 550 GBP one way. Book after the visa is granted.',
        costPence: 55000,
        costType: 'optional',
        daysBeforeIntake: 45,
        sourceUrl: 'https://www.ukcisa.org.uk/Information--Advice/Preparation-and-Arrival',
        lastUpdated: DATA_STAMP,
        orderIndex: 1,
      },
      {
        countryId: uk.id,
        stageId: stage('predeparture'),
        categoryId: cat('housing'),
        title: 'Arrange accommodation and pay the deposit',
        description:
          'University halls or private housing. Deposits are typically capped at five weeks of rent, estimate 600 GBP.',
        costPence: 60000,
        costType: 'optional',
        daysBeforeIntake: 60,
        sourceUrl: 'https://www.ukcisa.org.uk/Information--Advice/Living-in-the-UK/Housing',
        lastUpdated: DATA_STAMP,
        orderIndex: 2,
      },
      {
        countryId: uk.id,
        stageId: stage('predeparture'),
        categoryId: cat('documents'),
        title: 'Pack a documents folder for the border',
        description:
          'Passport, visa or eVisa share code, CAS letter, offer letter, TB certificate and proof of funds in your hand luggage.',
        costType: 'none',
        daysBeforeIntake: 14,
        sourceUrl: 'https://www.gov.uk/uk-border-control',
        lastUpdated: DATA_STAMP,
        orderIndex: 3,
      },
      {
        countryId: uk.id,
        stageId: stage('arrive'),
        categoryId: cat('visa'),
        title: 'Check your eVisa or collect your BRP',
        description:
          'Most students now get an eVisa. Set up your UKVI account and check your status within ten days of arriving.',
        costType: 'none',
        daysBeforeIntake: -10,
        sourceUrl: 'https://www.gov.uk/evisa',
        lastUpdated: DATA_STAMP,
        orderIndex: 1,
      },
      {
        countryId: uk.id,
        stageId: stage('arrive'),
        categoryId: cat('documents'),
        title: 'Complete university enrolment',
        description:
          'Attend enrolment with your passport and visa evidence to get your student ID.',
        costType: 'none',
        daysBeforeIntake: -3,
        lastUpdated: DATA_STAMP,
        orderIndex: 2,
      },
      {
        countryId: uk.id,
        stageId: stage('arrive'),
        categoryId: cat('health'),
        title: 'Register with a GP',
        description:
          'Register with a local GP surgery so you can use NHS services you already paid for.',
        costType: 'none',
        daysBeforeIntake: -14,
        sourceUrl: 'https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/',
        lastUpdated: DATA_STAMP,
        orderIndex: 3,
      },
      {
        countryId: uk.id,
        stageId: stage('arrive'),
        categoryId: cat('finance'),
        title: 'Open a UK bank account',
        description: 'You will need proof of study and address. Digital banks are often fastest.',
        costType: 'none',
        daysBeforeIntake: -14,
        sourceUrl:
          'https://www.ukcisa.org.uk/Information--Advice/Living-in-the-UK/Opening-a-bank-account',
        lastUpdated: DATA_STAMP,
        orderIndex: 4,
      },
      {
        countryId: uk.id,
        stageId: stage('arrive'),
        categoryId: cat('finance'),
        title: 'Apply for a National Insurance number if you will work',
        description: 'Free to apply. You need one to work part time during your studies.',
        costType: 'none',
        daysBeforeIntake: -21,
        sourceUrl: 'https://www.gov.uk/apply-national-insurance-number',
        lastUpdated: DATA_STAMP,
        orderIndex: 5,
      },
      {
        countryId: uk.id,
        stageId: stage('arrive'),
        categoryId: cat('arrival'),
        title: 'Get a 16 to 25 Railcard and student discounts',
        description:
          'A railcard costs 30 GBP per year and saves a third on rail fares. Also set up TOTUM or UNiDAYS.',
        costPence: 3000,
        costType: 'optional',
        daysBeforeIntake: -30,
        sourceUrl: 'https://www.16-25railcard.co.uk',
        lastUpdated: DATA_STAMP,
        orderIndex: 6,
      },
    ])
    .returning()

  await db.insert(resources).values([
    {
      countryId: uk.id,
      categoryId: cat('visa'),
      title: 'Student visa application fee',
      summary:
        'Applying for a Student visa from outside the UK costs 524 GBP per person. This is paid directly to the Home Office, never through an agent.',
      costPence: 52400,
      deadlineDaysBeforeIntake: 75,
      sourceUrl: 'https://www.gov.uk/student-visa',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('health'),
      title: 'Immigration Health Surcharge',
      summary:
        'Students pay 776 GBP per year of their visa as part of the application. It gives full access to the NHS.',
      costPence: 77600,
      deadlineDaysBeforeIntake: 75,
      sourceUrl: 'https://www.gov.uk/healthcare-immigration-application',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('finance'),
      title: 'Financial requirement for the Student visa',
      summary:
        'You must show 1483 GBP per month outside London or 1529 GBP per month in London, for up to nine months, held for 28 consecutive days before you apply.',
      deadlineDaysBeforeIntake: 110,
      sourceUrl: 'https://www.gov.uk/student-visa/money',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('documents'),
      title: 'IELTS for UKVI test fee',
      summary:
        'IELTS for UKVI Academic costs around 229 GBP depending on the test centre. Book directly with the official test provider.',
      costPence: 22900,
      deadlineDaysBeforeIntake: 300,
      sourceUrl: 'https://ielts.org/take-a-test/booking-your-test',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('health'),
      title: 'Tuberculosis test requirement',
      summary:
        'If you are from a listed country you need a TB test certificate from a Home Office approved clinic. Prices vary by country, roughly 65 to 150 GBP.',
      costPence: 10000,
      deadlineDaysBeforeIntake: 100,
      sourceUrl: 'https://www.gov.uk/tb-test-visa',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('documents'),
      title: 'UCAS application fee',
      summary:
        'One UCAS undergraduate application covering up to five choices costs 28.50 GBP for 2026 entry.',
      costPence: 2850,
      deadlineDaysBeforeIntake: 240,
      sourceUrl: 'https://www.ucas.com/undergraduate/applying-university',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('documents'),
      title: 'What a CAS is and how you get one',
      summary:
        'The Confirmation of Acceptance for Studies is a reference number your university issues after you accept an unconditional offer. You cannot apply for the visa without it.',
      deadlineDaysBeforeIntake: 120,
      sourceUrl: 'https://www.gov.uk/student-visa',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('visa'),
      title: 'eVisa and proving your status',
      summary:
        'Physical BRP cards are being replaced by eVisas. Create a UKVI account to view and prove your immigration status online.',
      deadlineDaysBeforeIntake: -10,
      sourceUrl: 'https://www.gov.uk/evisa',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('housing'),
      title: 'Accommodation deposits and your rights',
      summary:
        'Tenancy deposits in England are capped at five weeks of rent and must be protected in a government scheme. Never transfer money for a property you have not verified.',
      costPence: 60000,
      deadlineDaysBeforeIntake: 60,
      sourceUrl: 'https://www.ukcisa.org.uk/Information--Advice/Living-in-the-UK/Housing',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('finance'),
      title: 'Opening a UK bank account',
      summary:
        'Free to open. You typically need your passport, visa evidence and a proof of study letter from your university.',
      deadlineDaysBeforeIntake: -14,
      sourceUrl:
        'https://www.ukcisa.org.uk/Information--Advice/Living-in-the-UK/Opening-a-bank-account',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('finance'),
      title: 'National Insurance number',
      summary: 'Free to apply and needed for part time work. Apply once you have a UK address.',
      deadlineDaysBeforeIntake: -21,
      sourceUrl: 'https://www.gov.uk/apply-national-insurance-number',
      lastUpdated: DATA_STAMP,
    },
    {
      countryId: uk.id,
      categoryId: cat('arrival'),
      title: 'Official guidance is free, beware of agent fraud',
      summary:
        'Every rule on this site is published free by the UK government and universities. If an agency charges you for forms, guaranteed offers or visa influence, it is a red flag. Documented fraud cases exist.',
      sourceUrl: 'https://www.gov.uk/student-visa',
      lastUpdated: DATA_STAMP,
    },
  ])

  // Development only demo accounts. Never seed these in production;
  // they exist so the app and the e2e suite can be driven immediately
  // after a fresh bootstrap.
  const adminHash = bcrypt.hashSync('AdminPass123', 10)
  const studentHash = bcrypt.hashSync('StudentPass123', 10)

  const userRows = await db
    .insert(users)
    .values([
      {
        email: 'admin@studyou.app',
        passwordHash: adminHash,
        fullName: 'StudYou Admin',
        role: 'admin',
      },
      {
        email: 'student@studyou.app',
        passwordHash: studentHash,
        fullName: 'Demo Student',
        role: 'student',
        originCountryId: bangladesh.id,
      },
    ])
    .returning()

  const student = userRows.find((u) => u.role === 'student')
  if (!student) throw new Error('User seed failed')

  const intakeDate = '2026-09-21'
  const [journey] = await db
    .insert(journeys)
    .values({
      userId: student.id,
      countryId: uk.id,
      intakeDate,
      courseLevel: 'Undergraduate',
      budgetPence: 400000,
    })
    .returning()

  await db.insert(journeyTasks).values(
    templateRows.map((template) => ({
      journeyId: journey.id,
      templateId: template.id,
      targetDate: computeTargetDate(intakeDate, template.daysBeforeIntake),
    })),
  )

  await ensureEnvAdmin()
  await ensureUniversities()

  console.log('Seed complete.')
  console.log('Demo accounts (development only):')
  console.log('  admin@studyou.app / AdminPass123')
  console.log('  student@studyou.app / StudentPass123')
  await client.end()
}

seed().catch(async (error) => {
  console.error(error)
  await client.end()
  process.exit(1)
})
