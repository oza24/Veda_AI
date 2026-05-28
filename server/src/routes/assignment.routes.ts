import { Router } from 'express';
import * as assignmentController from '../controllers/assignment.controller';

const router = Router();

// Endpoint grouping under /api/assignments
router
  .route('/')
  .post(assignmentController.createAssignment)
  .get(assignmentController.getAssignments);

router.route('/:id').get(assignmentController.getAssignmentById);

router.route('/:id/paper').get(assignmentController.getAssignmentPaper);

export default router;
