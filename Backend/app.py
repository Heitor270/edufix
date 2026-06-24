import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from datetime import date

app = Flask(__name__)
CORS(app)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Frontend')

@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:filename>')
def frontend(filename):
    return send_from_directory(FRONTEND_DIR, filename)

def conectar():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "Hl180903!#"),
        database=os.getenv("DB_NAME", "inventario_escolar")
    )

# ─── USUARIO ───────────────────────────────

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuario WHERE email = %s AND senha = %s",
                   (dados['email'], dados['senha']))
    usuario = cursor.fetchone()
    conn.close()
    if usuario:
        return jsonify({"sucesso": True, "usuario": usuario})
    return jsonify({"sucesso": False, "mensagem": "Email ou senha inválidos"}), 401

@app.route('/cadastrar', methods=['POST'])
def cadastrar():
    dados = request.json
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO usuario (nome, email, senha, cpf, telefone, data_nascimento)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (dados['nome'], dados['email'], dados['senha'],
              dados['cpf'], dados['telefone'], dados['data_nascimento']))
        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Usuário cadastrado!"})
    except mysql.connector.IntegrityError:
        return jsonify({"sucesso": False, "mensagem": "Email ou CPF já cadastrado!"}), 400
    except Exception as e:
        return jsonify({"sucesso": False, "mensagem": "Erro ao cadastrar: " + str(e)}), 500

# ─── EQUIPAMENTO ───────────────────────────

@app.route('/equipamentos', methods=['GET'])
def listar_equipamentos():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM equipamento")
    equipamentos = cursor.fetchall()
    conn.close()
    return jsonify(equipamentos)

@app.route('/equipamentos/<int:id>', methods=['GET'])
def detalhar_equipamento(id):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.*,
               fn_custo_total_manutencao(e.id_equipamento)   AS custo_total_manutencao,
               fn_total_chamados_equipamento(e.id_equipamento) AS total_chamados,
               fn_verificar_disponibilidade(e.id_equipamento)  AS disponibilidade
        FROM equipamento e
        WHERE e.id_equipamento = %s
    """, (id,))
    equipamento = cursor.fetchone()
    conn.close()
    if not equipamento:
        return jsonify({"sucesso": False, "mensagem": "Equipamento não encontrado"}), 404
    return jsonify(equipamento)

@app.route('/equipamentos', methods=['POST'])
def adicionar_equipamento():
    dados = request.json
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO equipamento (nome, descricao, estado_conservacao, localizacao, numero_patrimonio, categoria, status, data_aquisicao)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (dados['nome'], dados['descricao'], dados['estado_conservacao'],
              dados['localizacao'], dados['numero_patrimonio'], dados['categoria'],
              dados['status'], dados['data_aquisicao']))
        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Equipamento adicionado!"})
    except mysql.connector.IntegrityError:
        return jsonify({"sucesso": False, "mensagem": "Nº de patrimônio já cadastrado!"}), 400
    except Exception as e:
        return jsonify({"sucesso": False, "mensagem": "Erro: " + str(e)}), 500

@app.route('/equipamentos/<int:id>', methods=['PUT'])
def atualizar_equipamento(id):
    dados = request.json
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE equipamento SET nome=%s, descricao=%s, estado_conservacao=%s,
        localizacao=%s, categoria=%s, status=%s WHERE id_equipamento=%s
    """, (dados['nome'], dados['descricao'], dados['estado_conservacao'],
          dados['localizacao'], dados['categoria'], dados['status'], id))
    conn.commit()
    conn.close()
    return jsonify({"sucesso": True, "mensagem": "Equipamento atualizado!"})

@app.route('/equipamentos/<int:id>', methods=['DELETE'])
def deletar_equipamento(id):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM equipamento WHERE id_equipamento = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"sucesso": True, "mensagem": "Equipamento removido!"})

# ─── CHAMADO ───────────────────────────────

@app.route('/chamados', methods=['GET'])
def listar_chamados():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM chamado")
    chamados = cursor.fetchall()
    conn.close()
    return jsonify(chamados)

@app.route('/chamados/<int:id>', methods=['GET'])
def detalhar_chamado(id):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.*,
               fn_tempo_resolucao_chamado(c.id_chamado) AS tempo_resolucao_dias
        FROM chamado c
        WHERE c.id_chamado = %s
    """, (id,))
    chamado = cursor.fetchone()
    conn.close()
    if not chamado:
        return jsonify({"sucesso": False, "mensagem": "Chamado não encontrado"}), 404
    return jsonify(chamado)

@app.route('/chamados', methods=['POST'])
def abrir_chamado():
    dados = request.json
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chamado (id_usuario, id_equipamento, prioridade, descricao_problema, observacoes)
            VALUES (%s, %s, %s, %s, %s)
        """, (dados['id_usuario'], dados.get('id_equipamento'), dados['prioridade'],
              dados['descricao_problema'], dados.get('observacoes', '')))
        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Chamado aberto!"})
    except Exception as e:
        return jsonify({"sucesso": False, "mensagem": "Erro: " + str(e)}), 500

@app.route('/chamados/<int:id>/status', methods=['PUT'])
def atualizar_status_chamado(id):
    dados = request.json
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT status FROM chamado WHERE id_chamado = %s", (id,))
        chamado = cursor.fetchone()
        status_anterior = chamado['status'] if chamado else None

        cursor.execute("UPDATE chamado SET status = %s WHERE id_chamado = %s",
                       (dados['status'], id))

        cursor.execute("""
            INSERT INTO historico_status_chamado (id_chamado, id_usuario, status_anterior, status_novo, observacao)
            VALUES (%s, %s, %s, %s, %s)
        """, (id, dados['id_usuario'], status_anterior, dados['status'], dados.get('observacao', '')))

        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Status atualizado!"})
    except Exception as e:
        return jsonify({"sucesso": False, "mensagem": "Erro: " + str(e)}), 500

@app.route('/chamados/<int:id>/historico', methods=['GET'])
def historico_chamado(id):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM historico_status_chamado WHERE id_chamado = %s ORDER BY data_alteracao", (id,))
    historico = cursor.fetchall()
    conn.close()
    return jsonify(historico)

# ─── MANUTENCAO ────────────────────────────

@app.route('/manutencoes', methods=['GET'])
def listar_manutencoes():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM manutencao")
    manutencoes = cursor.fetchall()
    conn.close()
    return jsonify(manutencoes)

@app.route('/manutencoes', methods=['POST'])
def registrar_manutencao():
    dados = request.json
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO manutencao (id_chamado, id_equipamento, data_inicio, descricao_servico, tecnico_responsavel, custo)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (dados['id_chamado'], dados['id_equipamento'], dados['data_inicio'],
              dados.get('descricao_servico', ''), dados['tecnico_responsavel'],
              dados.get('custo', 0.00)))
        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Manutenção registrada!"})
    except Exception as e:
        return jsonify({"sucesso": False, "mensagem": "Erro: " + str(e)}), 500

@app.route('/manutencoes/<int:id>', methods=['PUT'])
def concluir_manutencao(id):
    dados = request.json
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE manutencao SET data_fim=%s, descricao_servico=%s, custo=%s
        WHERE id_manutencao=%s
    """, (dados['data_fim'], dados['descricao_servico'], dados['custo'], id))
    conn.commit()
    conn.close()
    return jsonify({"sucesso": True, "mensagem": "Manutenção concluída!"})

# ─── ADMIN ─────────────────────────────────

@app.route('/admin', methods=['POST'])
def promover_admin():
    dados = request.json
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("UPDATE usuario SET tipo_usuario = 'admin' WHERE id_usuario = %s",
                       (dados['id_usuario'],))
        cursor.execute("""
            INSERT INTO admin (id_admin, nivel_acesso, permissoes)
            VALUES (%s, %s, %s)
        """, (dados['id_usuario'], dados.get('nivel_acesso', 1), dados.get('permissoes', 'admin')))
        conn.commit()
        conn.close()
        return jsonify({"sucesso": True, "mensagem": "Usuário promovido a admin!"})
    except Exception as e:
        return jsonify({"sucesso": False, "mensagem": "Erro: " + str(e)}), 500

@app.route('/admin', methods=['GET'])
def listar_admins():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.id_usuario, u.nome, u.email,
               a.nivel_acesso, a.permissoes,
               fn_total_chamados_abertos(u.id_usuario) AS chamados_abertos
        FROM usuario u
        INNER JOIN admin a ON u.id_usuario = a.id_admin
    """)
    admins = cursor.fetchall()
    conn.close()
    return jsonify(admins)

# ─── RELATÓRIO (RF10) ──────────────────────

@app.route('/relatorio', methods=['GET'])
def relatorio():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT status, COUNT(*) AS total FROM chamado GROUP BY status")
    por_status = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) AS total FROM equipamento")
    total_equipamentos = cursor.fetchone()

    cursor.execute("SELECT SUM(custo) AS custo_total FROM manutencao")
    custo_total = cursor.fetchone()

    cursor.execute("""
        SELECT e.id_equipamento, e.nome,
               fn_custo_total_manutencao(e.id_equipamento)    AS custo_manutencao,
               fn_total_chamados_equipamento(e.id_equipamento) AS total_chamados,
               fn_verificar_disponibilidade(e.id_equipamento)  AS disponibilidade
        FROM equipamento e
        ORDER BY fn_custo_total_manutencao(e.id_equipamento) DESC
    """)
    equipamentos_resumo = cursor.fetchall()

    conn.close()
    return jsonify({
        "chamados_por_status": por_status,
        "total_equipamentos": total_equipamentos['total'],
        "custo_total_manutencoes": custo_total['custo_total'] or 0,
        "equipamentos_resumo": equipamentos_resumo
    })

# ─── PROCEDURES DE CONSULTAS COMPLEXAS ────

@app.route('/relatorio/equipamentos', methods=['GET'])
def relatorio_equipamentos():
    categoria = request.args.get('categoria', None)
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.callproc('sp_resumo_equipamentos', [categoria])
    resultado = []
    for r in cursor.stored_results():
        resultado = r.fetchall()
    conn.close()
    return jsonify(resultado)

@app.route('/relatorio/chamados', methods=['GET'])
def relatorio_chamados():
    status = request.args.get('status', None)
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.callproc('sp_chamados_detalhados', [status])
    resultado = []
    for r in cursor.stored_results():
        resultado = r.fetchall()
    conn.close()
    return jsonify(resultado)

@app.route('/relatorio/usuarios', methods=['GET'])
def relatorio_usuarios():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.callproc('sp_desempenho_usuarios', [])
    resultado = []
    for r in cursor.stored_results():
        resultado = r.fetchall()
    conn.close()
    return jsonify(resultado)

if __name__ == '__main__':
    app.run(debug=True)