import { describe, expect, it } from 'vitest';
import {
  CURSOS_IDEALL,
  ESCALAS_INICIAIS,
  GRUPOS_DISPONIVEIS,
  MINISTERIOS_VOLUNTARIADO,
  PERFIL_DEMONSTRACAO,
  progressoCurso,
  resumoCursos,
} from './membros-data';

describe('dados da Área de Membros', () => {
  it('tem a rede de cursos da Jornada IdeAll com aulas em ordem', () => {
    expect(CURSOS_IDEALL.length).toBeGreaterThanOrEqual(3);
    for (const curso of CURSOS_IDEALL) {
      expect(curso.titulo.length).toBeGreaterThan(3);
      expect(curso.aulas.length).toBeGreaterThanOrEqual(2);
      expect(new Set(curso.aulas.map((a) => a.id)).size).toBe(curso.aulas.length);
    }
  });

  it('calcula o progresso de um curso e o resumo dos cursos inscritos', () => {
    const fundamentos = CURSOS_IDEALL.find((c) => c.id === 'curso-fundamentos');
    expect(fundamentos).toBeDefined();
    const progresso = progressoCurso(fundamentos!);
    expect(progresso.concluidas).toBe(2);
    expect(progresso.total).toBe(4);
    expect(progresso.percentual).toBe(50);

    const resumo = resumoCursos(CURSOS_IDEALL);
    expect(resumo.inscritos).toBe(1);
    expect(resumo.total).toBe(CURSOS_IDEALL.length);
    expect(resumo.aulasConcluidas).toBe(2);
    expect(resumo.aulasTotais).toBe(4);
    expect(resumo.percentual).toBe(50);

    const tudoConcluido = resumoCursos(
      CURSOS_IDEALL.map((c) => ({ ...c, inscrito: true, aulas: c.aulas.map((a) => ({ ...a, concluida: true })) })),
    );
    expect(tudoConcluido.percentual).toBe(100);
  });

  it('oferece iGrupos, escalas, ministérios e perfil de demonstração completos', () => {
    expect(GRUPOS_DISPONIVEIS.length).toBeGreaterThanOrEqual(4);
    expect(ESCALAS_INICIAIS.length).toBeGreaterThanOrEqual(2);
    expect(MINISTERIOS_VOLUNTARIADO.length).toBeGreaterThanOrEqual(4);
    expect(PERFIL_DEMONSTRACAO.familia.length).toBeGreaterThanOrEqual(1);
  });
});
