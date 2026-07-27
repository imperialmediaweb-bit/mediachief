export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  initials: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Andrew Parker",
    role: "Marketing Manager",
    company: "TechStart NYC",
    initials: "AP",
    quote:
      "Within 24h our article was live on 50 sites, with a complete PDF report. For our launch it was exactly what we needed — zero hassle, maximum visibility.",
  },
  {
    name: "Ellen Martin",
    role: "PR Specialist",
    company: "MediLife Clinic",
    initials: "EM",
    quote:
      "We used the National 50 package for our clinic's grand opening. I was impressed by the speed and the quality of the report. We've been using it regularly ever since.",
  },
  {
    name: "Victor Stone",
    role: "Founder",
    company: "BetExpert USA",
    initials: "VS",
    quote:
      "For the iGaming industry, the casino packages were perfect. Distribution across state and national pages brought us qualified traffic from day one.",
  },
];
