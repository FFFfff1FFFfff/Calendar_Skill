import Nylas from 'nylas';

const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY,
  apiUri: process.env.NYLAS_API_URI,
});

export function getAuthUrl(ownerId) {
  return nylas.auth.urlForOAuth2({
    clientId: process.env.NYLAS_CLIENT_ID,
    provider: 'google',
    redirectUri: process.env.NYLAS_CALLBACK_URI,
    state: ownerId,
  });
}

export async function exchangeCode(code) {
  return nylas.auth.exchangeCodeForToken({
    clientId: process.env.NYLAS_CLIENT_ID,
    clientSecret: process.env.NYLAS_API_KEY,
    redirectUri: process.env.NYLAS_CALLBACK_URI,
    code,
  });
}

export async function getFreeBusy(grantId, email, startTime, endTime) {
  const response = await nylas.calendars.getFreeBusy({
    identifier: grantId,
    requestBody: {
      startTime,
      endTime,
      emails: [email],
    },
  });
  return response.data;
}

export async function createEvent(grantId, { title, startTime, endTime, participants, description }) {
  const response = await nylas.events.create({
    identifier: grantId,
    queryParams: {
      calendarId: 'primary',
      notifyParticipants: true,
    },
    requestBody: {
      title,
      description,
      when: { startTime, endTime },
      participants,
    },
  });
  return response.data;
}
