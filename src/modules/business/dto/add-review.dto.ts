// dto/add-review.dto.ts
export class AddReviewDto {
  readonly rating: number;
  readonly comment: string;
  readonly userId: string; // Id of the user adding the review
}
