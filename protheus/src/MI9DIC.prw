#Include "Protheus.ch"

/*/{Protheus.doc} MI9DIC
Compatibilizador do dicionário da gestão de projetos MAIS i9.
Cria/atualiza SX2, SX3, SIX, SX7, SXB e SX6 e as tabelas físicas ZM1 a ZM9 e ZMA.
Pode ser executado mais de uma vez: registros existentes são atualizados.

Executar em ambiente de TESTE primeiro, com backup do banco e sem usuários conectados
(menu do SIGACFG ou Fórmulas: U_MI9DIC).

Tabelas:
  ZM1 Recursos                 ZM6 Apontamentos de horas
  ZM2 Indisponibilidades       ZM7 Alocações avulsas por semana
  ZM3 Projetos                 ZM8 Itens operacionais (RAID)
  ZM4 Atividades (cronograma)  ZM9 Feriados (adicionais e desconsiderados)
  ZM5 Atribuições              ZMA Alertas já avisados por e-mail
@author MAIS i9
/*/
User Function MI9DIC()
	Local cLog := ""
	If !MsgYesNo("Este processo cria ou atualiza as tabelas ZM1 a ZM9 e ZMA no dicionário da empresa " + cEmpAnt + "." + CRLF + ;
			"Faça backup do banco e garanta que não há usuários conectados." + CRLF + CRLF + "Continuar?", "MAIS i9 - Dicionário")
		Return Nil
	EndIf
	Processa({|| cLog := Atualiza()}, "MAIS i9", "Atualizando dicionário...", .F.)
	MemoWrite("\mi9dic.log", cLog)
	Aviso("MAIS i9 - Dicionário", cLog, {"OK"}, 3)
Return Nil

Static Function Atualiza()
	Local aSX2 := Tabelas()
	Local aSX3 := Campos()
	Local aSIX := Indices()
	Local aSX7 := Gatilhos()
	Local aSXB := Consultas()
	Local cLog := "Empresa " + cEmpAnt + " - " + DToC(Date()) + " " + Time() + CRLF + CRLF
	Local nI := 0
	Local cPath := ""
	Local cUsado := ""
	Local cReserv := ""
	Local cObrig := ""
	Local cNaoUs := ""
	Local cResFil := ""
	Local cOrdem := ""
	Local cAlias := ""
	Local nSeq := 0
	Local nTamFil := TamSX3("A1_FILIAL")[1]

	ProcRegua(Len(aSX2) * 2 + Len(aSX3) + Len(aSIX) + Len(aSX7) + Len(aSXB) + 1)

	// Valores codificados do dicionário copiados de campos padrão do cliente (SA1).
	DbSelectArea("SX3")
	SX3->(DbSetOrder(2))
	If SX3->(DbSeek(PadR("A1_COD", Len(SX3->X3_CAMPO))))
		cUsado := SX3->X3_USADO
		cReserv := SX3->X3_RESERV
		cObrig := SX3->X3_OBRIGAT
	EndIf
	If SX3->(DbSeek(PadR("A1_FILIAL", Len(SX3->X3_CAMPO))))
		cNaoUs := SX3->X3_USADO
		cResFil := SX3->X3_RESERV
	EndIf
	DbSelectArea("SX2")
	SX2->(DbSetOrder(1))
	If SX2->(DbSeek("SA1"))
		cPath := SX2->X2_PATH
	EndIf

	// SX2 - tabelas
	For nI := 1 To Len(aSX2)
		IncProc("SX2 " + aSX2[nI][1])
		Grava("SX2", 1, aSX2[nI][1], { ;
			{"X2_CHAVE", aSX2[nI][1]}, {"X2_PATH", cPath}, {"X2_ARQUIVO", aSX2[nI][1] + cEmpAnt + "0"}, ;
			{"X2_NOME", aSX2[nI][2]}, {"X2_NOMESPA", aSX2[nI][2]}, {"X2_NOMEENG", aSX2[nI][2]}, ;
			{"X2_MODO", "C"}, {"X2_MODOUN", "C"}, {"X2_MODOEMP", "C"}, {"X2_DELET", 0}, ;
			{"X2_UNICO", aSX2[nI][3]}, {"X2_PYME", "S"}})
		cLog += "Tabela " + aSX2[nI][1] + " - " + aSX2[nI][2] + CRLF
	Next nI

	// SX3 - campos (a ordem é a da lista, por tabela)
	For nI := 1 To Len(aSX3)
		IncProc("SX3 " + aSX3[nI][2])
		If aSX3[nI][1] <> cAlias
			cAlias := aSX3[nI][1]
			nSeq := 0
		EndIf
		nSeq++
		cOrdem := StrZero(nSeq, 2)
		Grava("SX3", 2, PadR(aSX3[nI][2], Len(SX3->X3_CAMPO)), { ;
			{"X3_ARQUIVO", aSX3[nI][1]}, {"X3_ORDEM", cOrdem}, {"X3_CAMPO", aSX3[nI][2]}, ;
			{"X3_TIPO", aSX3[nI][3]}, {"X3_TAMANHO", aSX3[nI][4]}, {"X3_DECIMAL", aSX3[nI][5]}, ;
			{"X3_TITULO", aSX3[nI][6]}, {"X3_TITSPA", aSX3[nI][6]}, {"X3_TITENG", aSX3[nI][6]}, ;
			{"X3_DESCRIC", aSX3[nI][7]}, {"X3_DESCSPA", aSX3[nI][7]}, {"X3_DESCENG", aSX3[nI][7]}, ;
			{"X3_PICTURE", aSX3[nI][8]}, {"X3_VALID", aSX3[nI][12]}, ;
			{"X3_USADO", IIf(aSX3[nI][19], cNaoUs, cUsado)}, {"X3_RESERV", IIf(aSX3[nI][19], cResFil, cReserv)}, ;
			{"X3_RELACAO", aSX3[nI][13]}, {"X3_F3", aSX3[nI][14]}, {"X3_NIVEL", 1}, ;
			{"X3_CHECK", ""}, {"X3_TRIGGER", IIf(aSX3[nI][18], "S", "")}, {"X3_PROPRI", "U"}, ;
			{"X3_BROWSE", IIf(aSX3[nI][10], "S", "N")}, {"X3_VISUAL", aSX3[nI][15]}, ;
			{"X3_CONTEXT", aSX3[nI][16]}, {"X3_OBRIGAT", IIf(aSX3[nI][9], cObrig, "")}, ;
			{"X3_CBOX", aSX3[nI][11]}, {"X3_CBOXSPA", aSX3[nI][11]}, {"X3_CBOXENG", aSX3[nI][11]}, ;
			{"X3_WHEN", aSX3[nI][20]}, {"X3_INIBRW", aSX3[nI][17]}, {"X3_GRPSXG", aSX3[nI][21]}, ;
			{"X3_PYME", "S"}})
	Next nI
	cLog += CRLF + cValToChar(Len(aSX3)) + " campos atualizados (SX3)." + CRLF

	// SIX - índices
	For nI := 1 To Len(aSIX)
		IncProc("SIX " + aSIX[nI][1])
		Grava("SIX", 1, aSIX[nI][1] + aSIX[nI][2], { ;
			{"INDICE", aSIX[nI][1]}, {"ORDEM", aSIX[nI][2]}, {"CHAVE", aSIX[nI][3]}, ;
			{"DESCRICAO", aSIX[nI][4]}, {"DESCSPA", aSIX[nI][4]}, {"DESCENG", aSIX[nI][4]}, ;
			{"PROPRI", "U"}, {"F3", ""}, {"NICKNAME", ""}, {"SHOWPESQ", "S"}})
	Next nI
	cLog += cValToChar(Len(aSIX)) + " índices atualizados (SIX)." + CRLF

	// SX7 - gatilhos
	For nI := 1 To Len(aSX7)
		IncProc("SX7 " + aSX7[nI][1])
		Grava("SX7", 1, PadR(aSX7[nI][1], Len(SX3->X3_CAMPO)) + aSX7[nI][2], { ;
			{"X7_CAMPO", aSX7[nI][1]}, {"X7_SEQUENC", aSX7[nI][2]}, {"X7_REGRA", aSX7[nI][3]}, ;
			{"X7_CDOMIN", aSX7[nI][4]}, {"X7_TIPO", "P"}, {"X7_SEEK", IIf(Empty(aSX7[nI][5]), "N", "S")}, ;
			{"X7_ALIAS", aSX7[nI][5]}, {"X7_ORDEM", IIf(Empty(aSX7[nI][5]), 0, 1)}, {"X7_CHAVE", aSX7[nI][6]}, ;
			{"X7_CONDIC", ""}, {"X7_PROPRI", "U"}})
	Next nI
	cLog += cValToChar(Len(aSX7)) + " gatilhos atualizados (SX7)." + CRLF

	// SXB - consultas padrão (F3)
	For nI := 1 To Len(aSXB)
		IncProc("SXB " + aSXB[nI][1])
		Grava("SXB", 1, PadR(aSXB[nI][1], Len(SXB->XB_ALIAS)) + aSXB[nI][2] + aSXB[nI][3] + aSXB[nI][4], { ;
			{"XB_ALIAS", aSXB[nI][1]}, {"XB_TIPO", aSXB[nI][2]}, {"XB_SEQ", aSXB[nI][3]}, {"XB_COLUNA", aSXB[nI][4]}, ;
			{"XB_DESCRI", aSXB[nI][5]}, {"XB_DESCSPA", aSXB[nI][5]}, {"XB_DESCENG", aSXB[nI][5]}, {"XB_CONTEM", aSXB[nI][6]}})
	Next nI
	cLog += cValToChar(Len(aSXB)) + " linhas de consulta padrão (SXB)." + CRLF

	// SX6 - parâmetros
	IncProc("SX6")
	Grava("SX6", 1, Space(nTamFil) + PadR("MV_MI9MAIL", Len(SX6->X6_VAR)), { ;
		{"X6_FIL", Space(nTamFil)}, {"X6_VAR", "MV_MI9MAIL"}, {"X6_TIPO", "L"}, ;
		{"X6_DESCRIC", "Envia os alertas da gestao de projetos"}, {"X6_DESC1", "MAIS i9 por e-mail (.T.) ou so registra (.F.)"}, ;
		{"X6_CONTEUD", ".F."}, {"X6_CONTSPA", ".F."}, {"X6_CONTENG", ".F."}, {"X6_PROPRI", "U"}, {"X6_PYME", "S"}})
	Grava("SX6", 1, Space(nTamFil) + PadR("MV_MI9DIAS", Len(SX6->X6_VAR)), { ;
		{"X6_FIL", Space(nTamFil)}, {"X6_VAR", "MV_MI9DIAS"}, {"X6_TIPO", "N"}, ;
		{"X6_DESCRIC", "Semanas a frente avaliadas no alerta de"}, {"X6_DESC1", "sobrecarga de recursos (gestao de projetos)"}, ;
		{"X6_CONTEUD", "2"}, {"X6_CONTSPA", "2"}, {"X6_CONTENG", "2"}, {"X6_PROPRI", "U"}, {"X6_PYME", "S"}})
	cLog += "Parâmetros MV_MI9MAIL e MV_MI9DIAS." + CRLF + CRLF

	// Tabelas físicas
	For nI := 1 To Len(aSX2)
		IncProc("Criando " + aSX2[nI][1])
		If Select(aSX2[nI][1]) > 0
			(aSX2[nI][1])->(DbCloseArea())
		EndIf
		__SetX31Mode(.F.)
		X31UpdTable(aSX2[nI][1])
		If __GetX31Error()
			cLog += "ERRO ao criar " + aSX2[nI][1] + ": " + __GetX31Trace() + CRLF
		Else
			DbSelectArea(aSX2[nI][1])
			cLog += "Tabela física " + aSX2[nI][1] + " ok." + CRLF
		EndIf
	Next nI
Return cLog

/*/ Grava ou atualiza um registro de dicionário. aVal = {{campo, valor}}; campos inexistentes na versão são ignorados. /*/
Static Function Grava(cTab, nOrd, cChave, aVal)
	Local nI := 0
	Local nPos := 0
	Local lNovo := .T.
	DbSelectArea(cTab)
	(cTab)->(DbSetOrder(nOrd))
	lNovo := !(cTab)->(DbSeek(cChave))
	RecLock(cTab, lNovo)
	For nI := 1 To Len(aVal)
		nPos := (cTab)->(FieldPos(aVal[nI][1]))
		If nPos > 0
			(cTab)->(FieldPut(nPos, aVal[nI][2]))
		EndIf
	Next nI
	(cTab)->(MsUnlock())
Return lNovo

// ---------------------------------------------------------------- Definições

Static Function Tabelas()
Return { ;
	{"ZM1", "Recursos MAIS i9", "ZM1_FILIAL+ZM1_COD"}, ;
	{"ZM2", "Indisponibilidades de recursos", "ZM2_FILIAL+ZM2_RECURS+ZM2_ITEM"}, ;
	{"ZM3", "Projetos", "ZM3_FILIAL+ZM3_COD"}, ;
	{"ZM4", "Atividades do cronograma", "ZM4_FILIAL+ZM4_PROJET+ZM4_ITEM"}, ;
	{"ZM5", "Atribuicoes de recursos", "ZM5_FILIAL+ZM5_PROJET+ZM5_ATIVID+ZM5_RECURS"}, ;
	{"ZM6", "Apontamentos de horas", "ZM6_FILIAL+ZM6_ID"}, ;
	{"ZM7", "Alocacoes avulsas por semana", "ZM7_FILIAL+ZM7_ID"}, ;
	{"ZM8", "Itens operacionais (RAID)", "ZM8_FILIAL+ZM8_PROJET+ZM8_ITEM"}, ;
	{"ZM9", "Feriados da gestao de projetos", "ZM9_FILIAL+DTOS(ZM9_DATA)"}, ;
	{"ZMA", "Alertas avisados por e-mail", "ZMA_FILIAL+ZMA_DEST+ZMA_CHAVE"} }

/*/
Campo: {alias, campo, tipo, tamanho, decimais, título (12), descrição (25), picture, obrigatório, browse,
        combo, validação, inicializador, F3, visual (A/V), contexto (R/V), ini. browse, gatilho, é filial, when, grupo SXG}
/*/
Static Function Cpo(cAlias, cCampo, cTipo, nTam, nDec, cTit, cDesc, cPic, lObr, lBrw, cBox, cVld, cIni, cF3, cVis, cCtx, cIBrw, lGat, cWhen, cGrp)
	Default cPic := ""
	Default lObr := .F.
	Default lBrw := .F.
	Default cBox := ""
	Default cVld := ""
	Default cIni := ""
	Default cF3 := ""
	Default cVis := "A"
	Default cCtx := "R"
	Default cIBrw := ""
	Default lGat := .F.
	Default cWhen := ""
	Default cGrp := ""
Return {cAlias, cCampo, cTipo, nTam, nDec, cTit, cDesc, cPic, lObr, lBrw, cBox, cVld, cIni, cF3, cVis, cCtx, cIBrw, lGat, .F., cWhen, cGrp}

Static Function Fil(cAlias)
	Local aF := Cpo(cAlias, cAlias + "_FILIAL", "C", TamSX3("A1_FILIAL")[1], 0, "Filial", "Filial do sistema", "@!")
	aF[19] := .T.
	aF[21] := "033"
Return aF

Static Function Campos()
	Local aC := {}
	Local nTCli := TamSX3("A1_COD")[1]
	Local nTLoj := TamSX3("A1_LOJA")[1]
	Local cSimNao := "1=Sim;2=Não"
	Local cStAtv := "1=Não iniciado;2=Em andamento;3=Bloqueado;4=Concluído;5=Cancelado"
	Local cNome := 'Posicione("ZM1",1,xFilial("ZM1")+%1,"ZM1_NOME")'

	// ZM1 - Recursos
	aAdd(aC, Fil("ZM1"))
	aAdd(aC, Cpo("ZM1", "ZM1_COD", "C", 6, 0, "Código", "Código do recurso", "@!", .T., .T., "", "", 'GetSXENum("ZM1","ZM1_COD")', "", "V"))
	aAdd(aC, Cpo("ZM1", "ZM1_NOME", "C", 40, 0, "Nome", "Nome do recurso", "@!", .T., .T.))
	aAdd(aC, Cpo("ZM1", "ZM1_CARGO", "C", 30, 0, "Cargo", "Cargo ou função", "", .F., .T.))
	aAdd(aC, Cpo("ZM1", "ZM1_AREA", "C", 30, 0, "Área", "Área ou equipe", "", .F., .T.))
	aAdd(aC, Cpo("ZM1", "ZM1_HSEM", "N", 5, 1, "Horas/semana", "Horas trabalhadas/semana", "@E 999.9", .T., .T., "", "Positivo()", "40"))
	aAdd(aC, Cpo("ZM1", "ZM1_ATIVO", "C", 1, 0, "Ativo", "Recurso ativo", "", .T., .T., cSimNao, 'Pertence("12")', '"1"'))
	aAdd(aC, Cpo("ZM1", "ZM1_GESTOR", "C", 1, 0, "Gestor", "Aprova e recebe alertas", "", .T., .T., cSimNao, 'Pertence("12")', '"2"'))
	aAdd(aC, Cpo("ZM1", "ZM1_USER", "C", 6, 0, "Usuário", "Usuário do Protheus", "", .F., .F., "", "Vazio() .Or. UsrExist(M->ZM1_USER)", "", "USR"))
	aAdd(aC, Cpo("ZM1", "ZM1_EMAIL", "C", 80, 0, "E-mail", "E-mail para alertas", "", .F., .F.))

	// ZM2 - Indisponibilidades
	aAdd(aC, Fil("ZM2"))
	aAdd(aC, Cpo("ZM2", "ZM2_RECURS", "C", 6, 0, "Recurso", "Código do recurso", "@!", .T., .F.))
	aAdd(aC, Cpo("ZM2", "ZM2_ITEM", "C", 3, 0, "Item", "Item", "@!", .T., .T., "", "", "", "", "V"))
	aAdd(aC, Cpo("ZM2", "ZM2_TIPO", "C", 1, 0, "Tipo", "Tipo de indisponibilidade", "", .T., .T., "1=Férias;2=Feriado local;3=Ausência;4=Treinamento;5=Bloqueio;6=Outros", 'Pertence("123456")', '"1"'))
	aAdd(aC, Cpo("ZM2", "ZM2_INICIO", "D", 8, 0, "Início", "Primeiro dia", "", .T., .T., "", "", "dDataBase"))
	aAdd(aC, Cpo("ZM2", "ZM2_FIM", "D", 8, 0, "Fim", "Último dia", "", .T., .T., "", "", "dDataBase"))
	aAdd(aC, Cpo("ZM2", "ZM2_HRDIA", "N", 4, 1, "Horas/dia", "Horas/dia (0 = dia todo)", "@E 99.9", .F., .T., "", "M->ZM2_HRDIA >= 0"))
	aAdd(aC, Cpo("ZM2", "ZM2_STATUS", "C", 1, 0, "Situação", "Situação da solicitação", "", .T., .T., "1=Pendente;2=Aprovada;3=Recusada", 'Pertence("123")', '"1"', "", "A", "R", "", .F., "U_MI9GEST()"))
	aAdd(aC, Cpo("ZM2", "ZM2_OBS", "C", 100, 0, "Observação", "Observação", "", .F., .T.))

	// ZM3 - Projetos
	aAdd(aC, Fil("ZM3"))
	aAdd(aC, Cpo("ZM3", "ZM3_COD", "C", 6, 0, "Código", "Código do projeto", "@!", .T., .T., "", "", 'GetSXENum("ZM3","ZM3_COD")', "", "V"))
	aAdd(aC, Cpo("ZM3", "ZM3_NOME", "C", 60, 0, "Projeto", "Nome do projeto", "", .T., .T.))
	aAdd(aC, Cpo("ZM3", "ZM3_CLIENT", "C", nTCli, 0, "Cliente", "Código do cliente", "@!", .T., .T., "", 'ExistCpo("SA1",M->ZM3_CLIENT)', "", "SA1", "A", "R", "", .T., "", "001"))
	aAdd(aC, Cpo("ZM3", "ZM3_LOJA", "C", nTLoj, 0, "Loja", "Loja do cliente", "@!", .T., .T., "", 'ExistCpo("SA1",M->ZM3_CLIENT+M->ZM3_LOJA)', "", "", "A", "R", "", .T., "", "002"))
	aAdd(aC, Cpo("ZM3", "ZM3_NOMCLI", "C", 20, 0, "Nome cliente", "Nome reduzido do cliente", "", .F., .T., "", "", ;
		'IIf(!INCLUI,Posicione("SA1",1,xFilial("SA1")+ZM3->ZM3_CLIENT+ZM3->ZM3_LOJA,"A1_NREDUZ"),"")', "", "V", "V", ;
		'Posicione("SA1",1,xFilial("SA1")+ZM3->ZM3_CLIENT+ZM3->ZM3_LOJA,"A1_NREDUZ")'))
	aAdd(aC, Cpo("ZM3", "ZM3_GP", "C", 6, 0, "GP", "Gerente do projeto", "@!", .F., .F., "", 'Vazio() .Or. ExistCpo("ZM1",M->ZM3_GP)', "", "ZM1", "A", "R", "", .T.))
	aAdd(aC, Cpo("ZM3", "ZM3_NOMGP", "C", 40, 0, "Nome do GP", "Nome do GP", "", .F., .T., "", "", ;
		"IIf(!INCLUI," + StrTran(cNome, "%1", "ZM3->ZM3_GP") + ',"")', "", "V", "V", StrTran(cNome, "%1", "ZM3->ZM3_GP")))
	aAdd(aC, Cpo("ZM3", "ZM3_TIPO", "C", 1, 0, "Tipo", "Tipo do projeto", "", .T., .T., "1=Projeto;2=Suporte;3=Sustentação;4=Alocação;5=Interno", 'Pertence("12345")', '"1"'))
	aAdd(aC, Cpo("ZM3", "ZM3_STATUS", "C", 1, 0, "Status", "Status do projeto", "", .T., .T., ;
		"1=Identificado;2=Aprovação do cliente;3=Não aprovado;4=Em andamento;5=Bloqueado;6=Concluído;7=Cancelado", 'Pertence("1234567")', '"1"'))
	aAdd(aC, Cpo("ZM3", "ZM3_PRIOR", "C", 1, 0, "Prioridade", "Prioridade do projeto", "", .T., .T., "1=Baixa;2=Média;3=Alta;4=Crítica", 'Pertence("1234")', '"2"'))
	aAdd(aC, Cpo("ZM3", "ZM3_STAEXE", "C", 1, 0, "Status exec.", "Status executivo (farol)", "", .F., .T., "1=Verde;2=Amarelo;3=Vermelho", 'Vazio() .Or. Pertence("123")'))
	aAdd(aC, Cpo("ZM3", "ZM3_KICKOF", "D", 8, 0, "Kickoff", "Data do kickoff", "", .F., .T.))
	aAdd(aC, Cpo("ZM3", "ZM3_GOLIVE", "D", 8, 0, "Go-live", "Data prevista do go-live", "", .F., .T.))
	aAdd(aC, Cpo("ZM3", "ZM3_HRVEND", "N", 8, 1, "Horas vend.", "Horas vendidas", "@E 99,999.9", .F., .T., "", "Positivo()"))
	aAdd(aC, Cpo("ZM3", "ZM3_NOTAS", "M", 10, 0, "Notas", "Notas do projeto", "", .F., .F.))

	// ZM4 - Atividades
	aAdd(aC, Fil("ZM4"))
	aAdd(aC, Cpo("ZM4", "ZM4_PROJET", "C", 6, 0, "Projeto", "Código do projeto", "@!", .T., .F.))
	aAdd(aC, Cpo("ZM4", "ZM4_ITEM", "C", 4, 0, "Item", "Item do cronograma", "@!", .T., .T., "", "", "", "", "V"))
	aAdd(aC, Cpo("ZM4", "ZM4_FASE", "C", 1, 0, "Fase", "Fase do projeto", "", .T., .T., "1=Envisioning;2=Development;3=Deployment;4=Post-deploy", 'Pertence("1234")', '"2"'))
	aAdd(aC, Cpo("ZM4", "ZM4_TAREFA", "C", 100, 0, "Tarefa", "Descrição da atividade", "", .T., .T.))
	aAdd(aC, Cpo("ZM4", "ZM4_INICIO", "D", 8, 0, "Início", "Início previsto", "", .F., .T.))
	aAdd(aC, Cpo("ZM4", "ZM4_FIM", "D", 8, 0, "Fim", "Fim previsto", "", .F., .T.))
	aAdd(aC, Cpo("ZM4", "ZM4_STATUS", "C", 1, 0, "Status", "Status da atividade", "", .T., .T., cStAtv, 'Pertence("12345")', '"1"'))
	aAdd(aC, Cpo("ZM4", "ZM4_PERC", "N", 3, 0, "% concluído", "Percentual concluído", "@E 999", .F., .T., "", "M->ZM4_PERC >= 0 .And. M->ZM4_PERC <= 100"))
	aAdd(aC, Cpo("ZM4", "ZM4_MARCO", "C", 1, 0, "Marco", "Atividade é marco", "", .F., .T., cSimNao, 'Pertence("12")', '"2"'))
	aAdd(aC, Cpo("ZM4", "ZM4_CLIPAR", "C", 1, 0, "Cliente part", "Cliente participa", "", .F., .T., cSimNao, 'Pertence("12")', '"2"'))

	// ZM5 - Atribuições
	aAdd(aC, Fil("ZM5"))
	aAdd(aC, Cpo("ZM5", "ZM5_PROJET", "C", 6, 0, "Projeto", "Código do projeto", "@!", .T., .F.))
	aAdd(aC, Cpo("ZM5", "ZM5_ATIVID", "C", 4, 0, "Atividade", "Item da atividade", "@!", .T., .F.))
	aAdd(aC, Cpo("ZM5", "ZM5_RECURS", "C", 6, 0, "Recurso", "Código do recurso", "@!", .T., .T., "", 'ExistCpo("ZM1",M->ZM5_RECURS)', "", "ZM1", "A", "R", "", .T.))
	aAdd(aC, Cpo("ZM5", "ZM5_NOMREC", "C", 40, 0, "Nome", "Nome do recurso", "", .F., .T., "", "", ;
		"IIf(!INCLUI," + StrTran(cNome, "%1", "ZM5->ZM5_RECURS") + ',"")', "", "V", "V"))
	aAdd(aC, Cpo("ZM5", "ZM5_ESFORC", "N", 7, 1, "Esforço (h)", "Horas previstas", "@E 9,999.9", .T., .T., "", "Positivo()"))
	aAdd(aC, Cpo("ZM5", "ZM5_REALIZ", "N", 7, 1, "Realizado", "Horas apontadas", "@E 9,999.9", .F., .T., "", "", "", "", "V"))

	// ZM6 - Apontamentos
	aAdd(aC, Fil("ZM6"))
	aAdd(aC, Cpo("ZM6", "ZM6_ID", "C", 8, 0, "Número", "Número do apontamento", "@!", .T., .T., "", "", 'GetSXENum("ZM6","ZM6_ID")', "", "V"))
	aAdd(aC, Cpo("ZM6", "ZM6_RECURS", "C", 6, 0, "Recurso", "Código do recurso", "@!", .T., .T., "", 'ExistCpo("ZM1",M->ZM6_RECURS)', "U_MI9MREC()", "ZM1", "A", "R", "", .T., "U_MI9GEST()"))
	aAdd(aC, Cpo("ZM6", "ZM6_NOMREC", "C", 40, 0, "Nome", "Nome do recurso", "", .F., .T., "", "", ;
		"IIf(!INCLUI," + StrTran(cNome, "%1", "ZM6->ZM6_RECURS") + "," + StrTran(cNome, "%1", "U_MI9MREC()") + ")", "", "V", "V", StrTran(cNome, "%1", "ZM6->ZM6_RECURS")))
	aAdd(aC, Cpo("ZM6", "ZM6_DATA", "D", 8, 0, "Data", "Data do trabalho", "", .T., .T., "", "M->ZM6_DATA <= dDataBase", "dDataBase"))
	aAdd(aC, Cpo("ZM6", "ZM6_PROJET", "C", 6, 0, "Projeto", "Código do projeto", "@!", .T., .T., "", 'ExistCpo("ZM3",M->ZM6_PROJET)', "", "ZM3"))
	aAdd(aC, Cpo("ZM6", "ZM6_ATIVID", "C", 4, 0, "Atividade", "Item da atividade", "@!", .T., .T., "", "U_MI9A030V()", "", "", "A", "R", "", .T.))
	aAdd(aC, Cpo("ZM6", "ZM6_TAREFA", "C", 60, 0, "Tarefa", "Descrição da atividade", "", .F., .T., "", "", ;
		'IIf(!INCLUI,Posicione("ZM4",1,xFilial("ZM4")+ZM6->ZM6_PROJET+ZM6->ZM6_ATIVID,"ZM4_TAREFA"),"")', "", "V", "V", ;
		'Posicione("ZM4",1,xFilial("ZM4")+ZM6->ZM6_PROJET+ZM6->ZM6_ATIVID,"ZM4_TAREFA")'))
	aAdd(aC, Cpo("ZM6", "ZM6_HORAS", "N", 5, 1, "Horas", "Horas trabalhadas", "@E 99.9", .T., .T., "", "Positivo() .And. M->ZM6_HORAS <= 24"))
	aAdd(aC, Cpo("ZM6", "ZM6_DESCR", "C", 120, 0, "Descrição", "O que foi feito", "", .F., .T.))

	// ZM7 - Alocações avulsas
	aAdd(aC, Fil("ZM7"))
	aAdd(aC, Cpo("ZM7", "ZM7_ID", "C", 8, 0, "Número", "Número da alocação", "@!", .T., .T., "", "", 'GetSXENum("ZM7","ZM7_ID")', "", "V"))
	aAdd(aC, Cpo("ZM7", "ZM7_PROJET", "C", 6, 0, "Projeto", "Código do projeto", "@!", .T., .T., "", 'ExistCpo("ZM3",M->ZM7_PROJET)', "", "ZM3"))
	aAdd(aC, Cpo("ZM7", "ZM7_RECURS", "C", 6, 0, "Recurso", "Código do recurso", "@!", .T., .T., "", 'ExistCpo("ZM1",M->ZM7_RECURS)', "", "ZM1"))
	aAdd(aC, Cpo("ZM7", "ZM7_SEMANA", "C", 8, 0, "Semana", "Semana ISO (2026-W40)", "@!", .T., .T., "", "U_MI9SEMV(M->ZM7_SEMANA)", "U_MI9SEM(dDataBase)[1]"))
	aAdd(aC, Cpo("ZM7", "ZM7_HORAS", "N", 6, 1, "Horas", "Horas avulsas na semana", "@E 9,999.9", .T., .T., "", "Positivo()"))
	aAdd(aC, Cpo("ZM7", "ZM7_OBS", "C", 100, 0, "Observação", "Motivo da alocação", "", .F., .T.))

	// ZM8 - Itens operacionais
	aAdd(aC, Fil("ZM8"))
	aAdd(aC, Cpo("ZM8", "ZM8_PROJET", "C", 6, 0, "Projeto", "Código do projeto", "@!", .T., .F.))
	aAdd(aC, Cpo("ZM8", "ZM8_ITEM", "C", 4, 0, "Item", "Item", "@!", .T., .T., "", "", "", "", "V"))
	aAdd(aC, Cpo("ZM8", "ZM8_TIPO", "C", 1, 0, "Tipo", "Tipo do item", "", .T., .T., ;
		"1=Pendência;2=Decisão;3=Dependência;4=Problema;5=Risco;6=Change request;7=Defeito", 'Pertence("1234567")', '"1"'))
	aAdd(aC, Cpo("ZM8", "ZM8_DESCR", "C", 200, 0, "Descrição", "Descrição do item", "", .T., .T.))
	aAdd(aC, Cpo("ZM8", "ZM8_RESP", "C", 6, 0, "Responsável", "Recurso responsável", "@!", .F., .T., "", 'Vazio() .Or. ExistCpo("ZM1",M->ZM8_RESP)', "", "ZM1"))
	aAdd(aC, Cpo("ZM8", "ZM8_RESPTX", "C", 40, 0, "Resp. client", "Responsável no cliente", "", .F., .T.))
	aAdd(aC, Cpo("ZM8", "ZM8_ABERT", "D", 8, 0, "Abertura", "Data de abertura", "", .F., .T., "", "", "dDataBase"))
	aAdd(aC, Cpo("ZM8", "ZM8_PRAZO", "D", 8, 0, "Prazo", "Prazo de solução", "", .F., .T.))
	aAdd(aC, Cpo("ZM8", "ZM8_STATUS", "C", 1, 0, "Status", "Status do item", "", .T., .T., ;
		"1=Aberto;2=Em andamento;3=Aguardando;4=Bloqueado;5=Aprovado;6=Reprovado;7=Fechado;8=Cancelado", 'Pertence("12345678")', '"1"'))
	aAdd(aC, Cpo("ZM8", "ZM8_PROB", "N", 1, 0, "Probabilid.", "Probabilidade (1 a 5)", "9", .F., .T., "", "M->ZM8_PROB >= 0 .And. M->ZM8_PROB <= 5"))
	aAdd(aC, Cpo("ZM8", "ZM8_IMPACT", "N", 1, 0, "Impacto", "Impacto (1 a 5)", "9", .F., .T., "", "M->ZM8_IMPACT >= 0 .And. M->ZM8_IMPACT <= 5"))
	aAdd(aC, Cpo("ZM8", "ZM8_HRCR", "N", 7, 1, "Horas CR", "Horas do change request", "@E 9,999.9", .F., .F.))
	aAdd(aC, Cpo("ZM8", "ZM8_DIACR", "N", 4, 0, "Dias CR", "Dias úteis do CR no prazo", "@E 9999", .F., .F.))

	// ZM9 - Feriados
	aAdd(aC, Fil("ZM9"))
	aAdd(aC, Cpo("ZM9", "ZM9_DATA", "D", 8, 0, "Data", "Data do feriado", "", .T., .T.))
	aAdd(aC, Cpo("ZM9", "ZM9_DESCR", "C", 60, 0, "Descrição", "Descrição", "", .T., .T.))
	aAdd(aC, Cpo("ZM9", "ZM9_TIPO", "C", 1, 0, "Tipo", "Adicionar/desconsiderar", "", .T., .T., "1=Adicionar feriado;2=Desconsiderar nacional", 'Pertence("12")', '"1"'))

	// ZMA - Alertas avisados
	aAdd(aC, Fil("ZMA"))
	aAdd(aC, Cpo("ZMA", "ZMA_DEST", "C", 6, 0, "Destinatár.", "Recurso avisado", "@!", .T., .T.))
	aAdd(aC, Cpo("ZMA", "ZMA_CHAVE", "C", 80, 0, "Chave", "Chave estável do alerta", "", .T., .T.))
	aAdd(aC, Cpo("ZMA", "ZMA_DATA", "D", 8, 0, "Data", "Data do aviso", "", .T., .T.))
Return aC

Static Function Indices()
Return { ;
	{"ZM1", "1", "ZM1_FILIAL+ZM1_COD", "Código"}, ;
	{"ZM1", "2", "ZM1_FILIAL+ZM1_USER", "Usuário"}, ;
	{"ZM1", "3", "ZM1_FILIAL+ZM1_NOME", "Nome"}, ;
	{"ZM2", "1", "ZM2_FILIAL+ZM2_RECURS+ZM2_ITEM", "Recurso + Item"}, ;
	{"ZM2", "2", "ZM2_FILIAL+ZM2_STATUS+ZM2_RECURS", "Situação + Recurso"}, ;
	{"ZM3", "1", "ZM3_FILIAL+ZM3_COD", "Código"}, ;
	{"ZM3", "2", "ZM3_FILIAL+ZM3_CLIENT+ZM3_LOJA", "Cliente + Loja"}, ;
	{"ZM3", "3", "ZM3_FILIAL+ZM3_STATUS+ZM3_COD", "Status + Código"}, ;
	{"ZM4", "1", "ZM4_FILIAL+ZM4_PROJET+ZM4_ITEM", "Projeto + Item"}, ;
	{"ZM4", "2", "ZM4_FILIAL+DTOS(ZM4_FIM)", "Fim previsto"}, ;
	{"ZM5", "1", "ZM5_FILIAL+ZM5_PROJET+ZM5_ATIVID+ZM5_RECURS", "Projeto + Atividade + Recurso"}, ;
	{"ZM5", "2", "ZM5_FILIAL+ZM5_RECURS", "Recurso"}, ;
	{"ZM6", "1", "ZM6_FILIAL+ZM6_ID", "Número"}, ;
	{"ZM6", "2", "ZM6_FILIAL+ZM6_RECURS+DTOS(ZM6_DATA)", "Recurso + Data"}, ;
	{"ZM6", "3", "ZM6_FILIAL+ZM6_PROJET+ZM6_ATIVID+ZM6_RECURS", "Projeto + Atividade + Recurso"}, ;
	{"ZM7", "1", "ZM7_FILIAL+ZM7_ID", "Número"}, ;
	{"ZM7", "2", "ZM7_FILIAL+ZM7_RECURS+ZM7_SEMANA", "Recurso + Semana"}, ;
	{"ZM7", "3", "ZM7_FILIAL+ZM7_PROJET+ZM7_SEMANA", "Projeto + Semana"}, ;
	{"ZM8", "1", "ZM8_FILIAL+ZM8_PROJET+ZM8_ITEM", "Projeto + Item"}, ;
	{"ZM8", "2", "ZM8_FILIAL+ZM8_STATUS+DTOS(ZM8_PRAZO)", "Status + Prazo"}, ;
	{"ZM9", "1", "ZM9_FILIAL+DTOS(ZM9_DATA)", "Data"}, ;
	{"ZMA", "1", "ZMA_FILIAL+ZMA_DEST+ZMA_CHAVE", "Destinatário + Chave"} }

/*/ Gatilho: {campo, sequência, regra, contradomínio, alias do seek, chave do seek} /*/
Static Function Gatilhos()
	Local cNome := 'Posicione("ZM1",1,xFilial("ZM1")+M->%1,"ZM1_NOME")'
Return { ;
	{"ZM3_CLIENT", "001", "SA1->A1_LOJA", "ZM3_LOJA", "SA1", 'xFilial("SA1")+M->ZM3_CLIENT'}, ;
	{"ZM3_CLIENT", "002", "SA1->A1_NREDUZ", "ZM3_NOMCLI", "SA1", 'xFilial("SA1")+M->ZM3_CLIENT'}, ;
	{"ZM3_LOJA", "001", 'Posicione("SA1",1,xFilial("SA1")+M->ZM3_CLIENT+M->ZM3_LOJA,"A1_NREDUZ")', "ZM3_NOMCLI", "", ""}, ;
	{"ZM3_GP", "001", StrTran(cNome, "%1", "ZM3_GP"), "ZM3_NOMGP", "", ""}, ;
	{"ZM5_RECURS", "001", StrTran(cNome, "%1", "ZM5_RECURS"), "ZM5_NOMREC", "", ""}, ;
	{"ZM6_RECURS", "001", StrTran(cNome, "%1", "ZM6_RECURS"), "ZM6_NOMREC", "", ""}, ;
	{"ZM6_ATIVID", "001", 'Posicione("ZM4",1,xFilial("ZM4")+M->ZM6_PROJET+M->ZM6_ATIVID,"ZM4_TAREFA")', "ZM6_TAREFA", "", ""} }

/*/ Consulta padrão: {alias, tipo, sequência, coluna, descrição, conteúdo} /*/
Static Function Consultas()
Return { ;
	{"ZM1", "1", "01", "DB", "Recursos MAIS i9", "ZM1"}, ;
	{"ZM1", "2", "01", "01", "Código", ""}, ;
	{"ZM1", "2", "02", "03", "Nome", ""}, ;
	{"ZM1", "4", "01", "01", "Código", "ZM1_COD"}, ;
	{"ZM1", "4", "01", "02", "Nome", "ZM1_NOME"}, ;
	{"ZM1", "4", "02", "01", "Nome", "ZM1_NOME"}, ;
	{"ZM1", "4", "02", "02", "Código", "ZM1_COD"}, ;
	{"ZM1", "5", "01", "", "", "ZM1->ZM1_COD"}, ;
	{"ZM3", "1", "01", "DB", "Projetos MAIS i9", "ZM3"}, ;
	{"ZM3", "2", "01", "01", "Código", ""}, ;
	{"ZM3", "4", "01", "01", "Código", "ZM3_COD"}, ;
	{"ZM3", "4", "01", "02", "Projeto", "ZM3_NOME"}, ;
	{"ZM3", "4", "01", "03", "Cliente", "ZM3_NOMCLI"}, ;
	{"ZM3", "5", "01", "", "", "ZM3->ZM3_COD"} }
