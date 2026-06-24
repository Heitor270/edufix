USE inventario_escolar;
 
DELIMITER $$
 
-- Calcula o custo total de todas as manutenções de um equipamento.
-- Uso: cálculo automático e totalização.

DROP FUNCTION IF EXISTS fn_custo_total_manutencao $$
 
CREATE FUNCTION fn_custo_total_manutencao(p_id_equipamento INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10, 2);
 
    SELECT COALESCE(SUM(custo), 0.00)
    INTO v_total
    FROM manutencao
    WHERE id_equipamento = p_id_equipamento;
 
    RETURN v_total;
END $$
 

-- Retorna a quantidade de chamados com status 'aberto' de um usuário.
-- Uso: retorno de indicador por usuário.

DROP FUNCTION IF EXISTS fn_total_chamados_abertos $$
 
CREATE FUNCTION fn_total_chamados_abertos(p_id_usuario INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT;
 
    SELECT COUNT(*)
    INTO v_total
    FROM chamado
    WHERE id_usuario = p_id_usuario
      AND status = 'aberto';
 
    RETURN v_total;
END $$
 

-- Verifica se um equipamento está disponível para uso.
-- Retorna 'Disponível' ou 'Indisponível'.
-- Uso: validação de status antes de vincular a um chamado.

DROP FUNCTION IF EXISTS fn_verificar_disponibilidade $$
 
CREATE FUNCTION fn_verificar_disponibilidade(p_id_equipamento INT)
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status VARCHAR(50);
 
    SELECT status
    INTO v_status
    FROM equipamento
    WHERE id_equipamento = p_id_equipamento;
 
    IF v_status = 'disponivel' THEN
        RETURN 'Disponível';
    ELSE
        RETURN 'Indisponível';
    END IF;
END $$
 

-- Calcula em dias o tempo de resolução de um chamado.
-- Se ainda aberto, calcula até a data atual.
-- Uso: cálculo automático de indicador de desempenho.

DROP FUNCTION IF EXISTS fn_tempo_resolucao_chamado $$
 
CREATE FUNCTION fn_tempo_resolucao_chamado(p_id_chamado INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_abertura  DATETIME;
    DECLARE v_fechamento DATETIME;
 
    SELECT data_abertura, data_fechamento
    INTO v_abertura, v_fechamento
    FROM chamado
    WHERE id_chamado = p_id_chamado;
 
    IF v_fechamento IS NULL THEN
        RETURN DATEDIFF(NOW(), v_abertura);
    END IF;
 
    RETURN DATEDIFF(v_fechamento, v_abertura);
END $$
 

-- Retorna o total de chamados vinculados a um equipamento.
-- Uso: indicador de histórico de problemas do equipamento.

DROP FUNCTION IF EXISTS fn_total_chamados_equipamento $$
 
CREATE FUNCTION fn_total_chamados_equipamento(p_id_equipamento INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT;
 
    SELECT COUNT(*)
    INTO v_total
    FROM chamado
    WHERE id_equipamento = p_id_equipamento;
 
    RETURN v_total;
END $$
 
DELIMITER ;