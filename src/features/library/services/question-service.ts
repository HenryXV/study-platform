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

export async function deleteQuestions(userId: string, questionIds: string[]) {
    const deleted = await QuestionRepository.deleteMany(userId, questionIds);
    return deleted;
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

export async function updateQuestions(userId: string, unitId: string, questions: EditableQuestion[], deletedIds: string[]) {
    const existingQuestions = questions.filter(q => q.id);
    const newQuestions = questions.filter(q => !q.id);

    // Check if there is anything to do
    if (existingQuestions.length === 0 && newQuestions.length === 0 && deletedIds.length === 0) {
        return; // Nothing to do
    }

    // Perform Deletions first
    if (deletedIds.length > 0) {
        await QuestionRepository.deleteMany(userId, deletedIds);
    }

    // Perform Updates
    if (existingQuestions.length > 0) {
        await QuestionRepository.updateBatch(userId, existingQuestions);
    }

    // Perform Creations
    if (newQuestions.length > 0) {
        // Reuse commitQuestions logic (findUnit -> createBatch)
        // We can just call commitQuestions or reuse the logic.
        // Calling commitQuestions is cleaner as it handles Unit verification
        await commitQuestions(userId, unitId, newQuestions);
    }
}
