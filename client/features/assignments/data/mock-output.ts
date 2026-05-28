import type { Answer, Question, QuestionPaperMetadata } from '@/features/assignments/types'

export const MOCK_PAPER_METADATA: QuestionPaperMetadata = {
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  subject: 'Science',
  className: 'Grade 8',
  timeAllowed: 45,
  maximumMarks: 20,
  aiMessage:
    'Generating Lalai Bigirl Here are customized Question Paper for your CBSE Grade 8 Science classes on the NCERT syllabus',
}

export const MOCK_SECTION_A_QUESTIONS: Question[] = [
  {
    id: '1',
    text: 'Define Electrolysis. Explain its purpose.',
    marks: 2,
    difficulty: 'easy',
  },
  {
    id: '2',
    text: 'Why does a conductor conduct electricity better than an insulator?',
    marks: 2,
    difficulty: 'medium',
  },
  {
    id: '3',
    text: 'Measure the size of a copper sulfate crystals during electrolysis? (2 Marks)',
    marks: 2,
    difficulty: 'medium',
  },
  {
    id: '4',
    text: 'Challenging: How is hydroelectric produced during the description of what times the chemical reactions involved?',
    marks: 2,
    difficulty: 'hard',
  },
  {
    id: '5',
    text: 'Shogi Mention the type of current used in electrolysis and justify why it is used.',
    marks: 2,
    difficulty: 'medium',
  },
]

export const MOCK_SECTION_B_QUESTIONS: Question[] = [
  {
    id: '6',
    text: 'Examine an experiment that would best demonstrate an example of the electroplating process. (2 Marks)',
    marks: 2,
    difficulty: 'medium',
  },
  {
    id: '7',
    text: 'Challenging: What happens in the cathode during the electrolysis of copper is deposited during the wire leaching of an object? (2 Marks)',
    marks: 2,
    difficulty: 'hard',
  },
  {
    id: '8',
    text: 'Shogi Mention the type of current used in electrolysis and justify why it is used in Electricity? (2 Marks)',
    marks: 2,
    difficulty: 'medium',
  },
  {
    id: '9',
    text: 'Challenging: What is the importance of the type of casing? (2 Marks)',
    marks: 2,
    difficulty: 'hard',
  },
]

export const MOCK_ANSWERS: Answer[] = [
  {
    questionNumber: 1,
    text: 'Electrolysis is the process of decomposing a chemical by means of electric current. Its purpose is to separate elements from their compounds.',
  },
  {
    questionNumber: 2,
    text: 'A conductor allows the free movement of electrons, while an insulator does not. Copper is a good conductor of electricity due to the presence of free electrons.',
  },
  {
    questionNumber: 3,
    text: 'The size of copper sulfate crystals increases during electrolysis as copper ions deposit on the cathode, forming larger crystal structures.',
  },
  {
    questionNumber: 4,
    text: 'Hydroelectric power is produced through the movement of water, which has potential energy that converts into kinetic energy, driving turbines connected to generators.',
  },
  {
    questionNumber: 5,
    text: 'Direct current (DC) is used in electrolysis because it provides unidirectional electron flow, essential for the decomposition of chemical compounds.',
  },
  {
    questionNumber: 6,
    text: 'Electroplating involves depositing a layer of one metal onto another using electrolysis, demonstrating how electrical current can drive chemical change.',
  },
  {
    questionNumber: 7,
    text: 'During copper electrolysis, copper ions migrate to the cathode where they gain electrons and deposit as pure copper metal on the electrode surface.',
  },
  {
    questionNumber: 8,
    text: 'DC is preferred in electrolysis because it ensures consistent ionic movement and deposition, which AC cannot provide due to its alternating nature.',
  },
  {
    questionNumber: 9,
    text: 'The type of casing (insulating material) is important to prevent electrical leakage and ensure safety during the electrolysis process.',
  },
]
