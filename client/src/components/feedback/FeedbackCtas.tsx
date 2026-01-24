export const REVIEW_URL = "/review";

type FeedbackCtasProps = {
  rating: number | null;
};

export function FeedbackCtas({ rating }: FeedbackCtasProps) {
  if (!rating) {
    return (
      <p className="text-xs text-slate-500">Share your rating to unlock next steps.</p>
    );
  }

  if (rating >= 4) {
    return (
      <p>If you’re happy with RoomStager, leaving a quick review helps a lot.</p>
    );
  }

  return (
    <p>Thanks — we review every submission and use it to improve quality.</p>
  );
}
