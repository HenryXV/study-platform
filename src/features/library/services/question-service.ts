import { Question as GeneratorQuestion, EditableQuestion } from '@/features/library/schemas/question-generator';
import { QuestionRepository } from '@/features/library/repositories/question.repository';
import { ContentRepository } from '@/features/library/repositories/content.repository';
import { DomainError, NotFoundError } from '@/lib/errors';

/**
 * Service to handle Question CRUD.
 */

export async function deleteQuestion(userId: string, questionId: string) {
    const deleted = await QuestionRepository.deleteMany(userId, [questionId]);

    if (deleted.count === 0) {
        throw new NotFoundError('Question not found or unauthorized');
    }
}

export async function commitQuestions(userId: string, unitId: string, questions: GeneratorQuestion[]) {
    // 1. Verify Unit exists and fetch context (SubjectId)
    const unit = await ContentRepository.findUnitById(unitId);

    if (!unit) {
        throw new NotFoundError("Unit not found");
    }

    // 2. Delegate creation to Repository (which handles Transaction and ConnectOrCreate)
    const createdQuestions = await QuestionRepository.createBatch(
        userId,
        unit.id,
        unit.source.subjectId, // Can be null, Repository handles it
        questions
    );

    return createdQuestions.length;
}

export async function updateQuestions(userId: string, questions: EditableQuestion[], deletedIds: string[]) {
    const questionsToUpdate = questions.filter(q => q.id);

    // Check if there is anything to do
    if (questionsToUpdate.length === 0 && deletedIds.length === 0) {
        return; // Nothing to do
    }

    // Perform Deletions first
    if (deletedIds.length > 0) {
        await QuestionRepository.deleteMany(userId, deletedIds);
    }

    // Perform Updates
    if (questionsToUpdate.length > 0) {
        await QuestionRepository.updateBatch(userId, questionsToUpdate);
    }
}
