--  Tópico 5 - Procedures de Consultas Complexas

USE inventario_escolar;

DELIMITER $$

-- Retorna um resumo completo de cada equipamento com seus
-- chamados, manutenções e custos totais.
-- Parâmetro: p_categoria (NULL = todos, ou filtrar por categoria)

DROP PROCEDURE IF EXISTS sp_resumo_equipamentos $$

CREATE PROCEDURE sp_resumo_equipamentos(IN p_categoria VARCHAR(50))
BEGIN
    SELECT
        e.id_equipamento                                AS id_equipamento,
        e.nome                                          AS nome_equipamento,
        e.categoria                                     AS categoria,
        e.localizacao                                   AS localizacao,
        e.estado_conservacao                            AS conservacao,
        fn_verificar_disponibilidade(e.id_equipamento)  AS disponibilidade,
        fn_total_chamados_equipamento(e.id_equipamento) AS total_chamados,
        fn_custo_total_manutencao(e.id_equipamento)     AS custo_total_manutencao,
        COUNT(m.id_manutencao)                          AS total_manutencoes_realizadas,
        MAX(m.data_fim)                                 AS data_ultima_manutencao

    FROM equipamento e
    LEFT JOIN chamado    c ON e.id_equipamento = c.id_equipamento
    LEFT JOIN manutencao m ON e.id_equipamento = m.id_equipamento

    WHERE (p_categoria IS NULL OR e.categoria = p_categoria)

    GROUP BY
        e.id_equipamento,
        e.nome,
        e.categoria,
        e.localizacao,
        e.estado_conservacao

    HAVING
        fn_total_chamados_equipamento(e.id_equipamento) > 0
        OR COUNT(m.id_manutencao) > 0

    ORDER BY
        custo_total_manutencao  DESC,
        total_chamados          DESC;
END $$


-- Retorna chamados com dados completos do usuário, equipamento
-- e total de manutenções vinculadas.
-- Parâmetro: p_status (NULL = todos, ou 'aberto', 'concluido', etc.)

DROP PROCEDURE IF EXISTS sp_chamados_detalhados $$

CREATE PROCEDURE sp_chamados_detalhados(IN p_status VARCHAR(20))
BEGIN
    SELECT
        c.id_chamado                                AS id_chamado,
        c.status                                    AS status,
        c.prioridade                                AS prioridade,
        c.data_abertura                             AS data_abertura,
        c.data_fechamento                           AS data_fechamento,
        fn_tempo_resolucao_chamado(c.id_chamado)    AS dias_resolucao,
        c.descricao_problema                        AS descricao,
        u.nome                                      AS nome_usuario,
        u.email                                     AS email_usuario,
        e.nome                                      AS nome_equipamento,
        e.localizacao                               AS localizacao_equipamento,
        e.categoria                                 AS categoria_equipamento,
        COUNT(m.id_manutencao)                      AS total_manutencoes

    FROM chamado c
    INNER JOIN usuario    u ON c.id_usuario     = u.id_usuario
    LEFT  JOIN equipamento e ON c.id_equipamento = e.id_equipamento
    LEFT  JOIN manutencao  m ON c.id_chamado     = m.id_chamado

    WHERE (p_status IS NULL OR c.status = p_status)

    GROUP BY
        c.id_chamado,
        c.status,
        c.prioridade,
        c.data_abertura,
        c.data_fechamento,
        c.descricao_problema,
        u.nome,
        u.email,
        e.nome,
        e.localizacao,
        e.categoria

    ORDER BY
        FIELD(c.prioridade, 'critica', 'alta', 'media', 'baixa'),
        c.data_abertura DESC;
END $$



-- Retorna indicadores de atividade de cada usuário ativo:
-- chamados abertos, interações de status e último chamado.

DROP PROCEDURE IF EXISTS sp_desempenho_usuarios $$

CREATE PROCEDURE sp_desempenho_usuarios()
BEGIN
    SELECT
        u.id_usuario                                    AS id_usuario,
        u.nome                                          AS nome_usuario,
        u.email                                         AS email,
        u.tipo_usuario                                  AS tipo,
        COUNT(DISTINCT c.id_chamado)                    AS total_chamados_criados,
        fn_total_chamados_abertos(u.id_usuario)         AS chamados_ainda_abertos,
        COUNT(DISTINCT h.id_historico)                  AS total_interacoes_status,
        MAX(c.data_abertura)                            AS ultimo_chamado_criado

    FROM usuario u
    LEFT JOIN chamado                c  ON u.id_usuario = c.id_usuario
    LEFT JOIN historico_status_chamado h ON u.id_usuario = h.id_usuario

    WHERE u.ativo = TRUE

    GROUP BY
        u.id_usuario,
        u.nome,
        u.email,
        u.tipo_usuario

    HAVING COUNT(DISTINCT c.id_chamado) > 0

    ORDER BY
        total_chamados_criados  DESC,
        total_interacoes_status DESC;
END $$

DELIMITER ;