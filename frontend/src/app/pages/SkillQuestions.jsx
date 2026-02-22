import React from 'react';
import Card from '../components/ui/Card';
import { skillQuestionsData } from '../data/mockData';

export default function SkillQuestions() {
  return (
    <div className="p-6 space-y-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Skill Verification Questions</h1>
      {skillQuestionsData.map(skill => (
        <Card key={skill.skill}>
          <h2 className="font-semibold mb-2">{skill.skill}</h2>
          <ul className="list-disc pl-5 space-y-1">
            {skill.questions.map(q => (
              <li key={q.level}>
                <strong>{q.level}:</strong> {q.question}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
