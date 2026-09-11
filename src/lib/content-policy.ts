/**
 * The content declaration a buyer ticks before paying.
 *
 * With card payment the money moves before anyone reads the article, so the
 * question has to be asked before payment and the answer has to stay on the
 * order: if the declaration is false, the order is cancelled and the amount
 * is not refunded. One text, imported everywhere it appears.
 */
export const CONTENT_DECLARATION =
  "I confirm the article does not present causes, treatments or cures for diseases " +
  "(cancer, chronic or serious conditions) and does not promote medicines, supplements " +
  "or therapies as an alternative to medical treatment.";

export const CONTENT_DECLARATION_ERROR =
  "Tick the content declaration to continue.";

export const CONTENT_DECLARATION_WARNING =
  "If the declaration turns out to be untrue, the order is cancelled, the article is taken down and the amount paid is not refunded.";
