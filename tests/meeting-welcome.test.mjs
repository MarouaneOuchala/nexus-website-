import { test } from "node:test";
import assert from "node:assert/strict";
import { moroccoMeetingInput, parseMoroccoMeeting, validMeetingUrl, welcomeMessage } from "../src/lib/meeting-welcome.ts";

test("meeting time is Morocco time, not the admin device's time zone", () => {
  for (const zone of ["UTC", "America/New_York", "Asia/Tokyo", "Africa/Casablanca"]) {
    const previous = process.env.TZ;
    try {
      process.env.TZ = zone;
      assert.equal(parseMoroccoMeeting("2026-10-28T18:30"), "2026-10-28T17:30:00.000Z");
      assert.equal(moroccoMeetingInput("2026-10-28T17:30:00Z"), "2026-10-28T18:30");
      assert.equal(parseMoroccoMeeting("2026-03-01T18:30"), "2026-03-01T18:30:00.000Z");
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  }
});

test("invalid, skipped and repeated Morocco times are rejected", () => {
  for (const value of ["", "nonsense", "2026-02-30T18:00", "2026-13-01T18:00", "2026-10-28T25:00", "2026-02-15T02:30", "2026-03-22T02:30"]) {
    assert.throws(() => parseMoroccoMeeting(value), /INVALID_MEETING_TIME/, value);
  }
  assert.equal(moroccoMeetingInput(null), "");
});

test("welcome messages use the client's language, names and saved Morocco time", () => {
  const input = { client: "Salma", teacher: "Mohammed", meetingAt: "2026-10-28T17:30:00Z", diagnostic: true };
  for (const [language, greeting, zone, diagnostic] of [
    ["en", "Hello Salma", "Morocco time", "free 20-minute"],
    ["fr", "Bonjour Salma", "heure du Maroc", "gratuit de 20 minutes"],
    ["ar", "مرحبًا Salma", "بتوقيت المغرب", "المجانية"],
  ]) {
    const message = welcomeMessage({ ...input, language, meetingUrl: "https://meet.google.com/test-meeting" });
    for (const value of [greeting, zone, diagnostic, "Mohammed", "https://meet.google.com/test-meeting"]) assert.ok(message.includes(value), value);
    assert.ok(message.includes("18:30") || (language === "ar" && message.includes("١٨:٣٠")), message);
  }
  const general = welcomeMessage({ ...input, language: "en", diagnostic: false });
  assert.ok(general.includes("your English session"));
  assert.ok(!general.includes("free 20-minute"));
  assert.ok(!general.includes("Meeting link:"));
});

test("optional meeting links must be valid HTTPS without embedded credentials", () => {
  for (const value of ["", "https://meet.google.com/abc-defg-hij"]) assert.equal(validMeetingUrl(value), true);
  for (const value of ["javascript:alert(1)", "http://example.com", "https://", "https://user:pass@example.com", "https://example.com/a b", `https://example.com/${"a".repeat(2000)}`]) assert.equal(validMeetingUrl(value), false);
});
