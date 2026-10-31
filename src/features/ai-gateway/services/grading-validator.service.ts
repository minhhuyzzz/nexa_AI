import { RubricDef, RubricGradingOutput, CriterionScore } from '../types/grading.types';

export interface ValidatedGradingResult extends RubricGradingOutput {
  citationStatus: 'VALID_CITATION' | 'INVALID_CITATION' | 'NO_CITATION';
  recalculated: boolean;
}

export class GradingValidatorService {
  /**
   * Xác minh trích dẫn evidenceQuote xem có thực sự tồn tại trong bài làm thí sinh hay bị ảo giác (hallucination).
   */
  public static verifyEvidenceQuote(
    studentResponse: string,
    evidenceQuote?: string | null
  ): { validCitation: boolean; citationStatus: 'VALID_CITATION' | 'INVALID_CITATION' | 'NO_CITATION' } {
    if (!evidenceQuote || !evidenceQuote.trim()) {
      return { validCitation: false, citationStatus: 'NO_CITATION' };
    }

    const cleanQuote = evidenceQuote
      .replace(/^["'«“]|["'»”]$/g, '')
      .trim()
      .toLowerCase();

    if (!cleanQuote || cleanQuote.length < 5) {
      return { validCitation: false, citationStatus: 'NO_CITATION' };
    }

    const cleanResponse = (studentResponse || '').toLowerCase();

    // Check direct substring
    if (cleanResponse.includes(cleanQuote)) {
      return { validCitation: true, citationStatus: 'VALID_CITATION' };
    }

    // Check if normalized whitespace matches
    const normalizedQuote = cleanQuote.replace(/\s+/g, ' ');
    const normalizedResponse = cleanResponse.replace(/\s+/g, ' ');

    if (normalizedResponse.includes(normalizedQuote)) {
      return { validCitation: true, citationStatus: 'VALID_CITATION' };
    }

    // Segment check for longer quotes
    if (normalizedQuote.length >= 25) {
      const halfLength = Math.floor(normalizedQuote.length / 2);
      const firstHalf = normalizedQuote.slice(0, halfLength).trim();
      const secondHalf = normalizedQuote.slice(halfLength).trim();

      if (
        (firstHalf.length >= 12 && normalizedResponse.includes(firstHalf)) ||
        (secondHalf.length >= 12 && normalizedResponse.includes(secondHalf))
      ) {
        return { validCitation: true, citationStatus: 'VALID_CITATION' };
      }
    }

    return { validCitation: false, citationStatus: 'INVALID_CITATION' };
  }

  /**
   * Tái tính điểm phía server theo Rubric để đảm bảo tính xác định và độ tin cậy tuyệt đối:
   * score = maxPoints * scorePercent / 100
   * Tổng điểm bài không được vượt quá maxScore của câu hỏi.
   */
  public static validateAndRecalculateScores(
    rawOutput: RubricGradingOutput,
    rubric: RubricDef,
    studentResponse: string
  ): ValidatedGradingResult {
    let recalculatedTotal = 0;
    let expectedMaxScore = 0;

    const validatedCriterionScores: CriterionScore[] = rawOutput.criterionScores.map((rawCrit) => {
      // Find matching criterion definition from rubric
      const critDef =
        rubric.criteria.find((c) => c.id === rawCrit.criterionId) ||
        rubric.criteria.find(
          (c) => c.name.toLowerCase().trim() === rawCrit.criterionName.toLowerCase().trim()
        );

      const maxPoints = critDef ? critDef.maxPoints : rawCrit.maxPoints;
      expectedMaxScore += maxPoints;

      let scorePercent = 0;
      if (critDef && critDef.levels && critDef.levels.length > 0) {
        // Find matching level
        const matchedLevel =
          critDef.levels.find(
            (l) => l.levelName.toLowerCase().trim() === rawCrit.selectedLevel.toLowerCase().trim()
          ) ||
          critDef.levels.find((l) =>
            rawCrit.selectedLevel.toLowerCase().includes(l.levelName.toLowerCase())
          );

        if (matchedLevel) {
          scorePercent = matchedLevel.scorePercent;
        } else {
          scorePercent = maxPoints > 0 ? (rawCrit.score / maxPoints) * 100 : 0;
        }
      } else {
        scorePercent = maxPoints > 0 ? (rawCrit.score / maxPoints) * 100 : 0;
      }

      const boundedPercent = Math.max(0, Math.min(100, scorePercent));
      const calculatedScore = Math.round(((boundedPercent / 100) * maxPoints) * 10) / 10;
      recalculatedTotal += calculatedScore;

      return {
        criterionId: critDef?.id || rawCrit.criterionId,
        criterionName: critDef?.name || rawCrit.criterionName,
        selectedLevel: rawCrit.selectedLevel,
        score: calculatedScore,
        maxPoints,
        justification: rawCrit.justification,
        evidenceQuote: rawCrit.evidenceQuote,
      };
    });

    const citationVerification = this.verifyEvidenceQuote(studentResponse, rawOutput.evidenceQuote);

    let confidenceFlag = rawOutput.confidenceFlag;
    let confidenceScore = rawOutput.confidenceScore;
    if (citationVerification.citationStatus === 'INVALID_CITATION') {
      confidenceFlag = 'AMBER';
      confidenceScore = Math.min(confidenceScore, 65);
    }

    const finalTotal = Math.round(recalculatedTotal * 10) / 10;
    const finalMaxScore = expectedMaxScore > 0 ? expectedMaxScore : rawOutput.maxScore;

    return {
      ...rawOutput,
      totalScore: Math.min(finalTotal, finalMaxScore),
      maxScore: finalMaxScore,
      confidenceScore,
      confidenceFlag,
      criterionScores: validatedCriterionScores,
      citationStatus: citationVerification.citationStatus,
      recalculated: true,
    };
  }
}
