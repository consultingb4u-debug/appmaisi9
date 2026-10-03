#Include "Protheus.ch"
#Include "TopConn.ch"

/*/{Protheus.doc} MI9CALC
Cálculos da gestão de projetos MAIS i9 a partir das tabelas ZM*:
carga planejada por recurso e semana (rateio do cronograma + alocações avulsas), capacidade líquida,
indicadores do projeto, alertas e atualização das horas realizadas.
As regras em si ficam em MI9DOM.prw.
@author MAIS i9
/*/

// Status do projeto (ZM3_STATUS) considerados ativos: aprovação do cliente, em andamento, bloqueado.
#Define PRJ_ATIVOS "('2','4','5')"
// Projetos que não geram carga: não aprovado, concluído, cancelado.
#Define PRJ_SEM_CARGA "('3','6','7')"

// ---------------------------------------------------------------- Usuário e permissões

/*/{Protheus.doc} MI9MREC
Código do recurso (ZM1) vinculado ao usuário logado; vazio se não houver.
/*/
User Function MI9MREC()
	Local aArea := GetArea()
	Local cRec := ""
	DbSelectArea("ZM1")
	ZM1->(DbSetOrder(2))
	If ZM1->(DbSeek(xFilial("ZM1") + PadR(__cUserId, Len(ZM1->ZM1_USER))))
		cRec := ZM1->ZM1_COD
	EndIf
	RestArea(aArea)
Return cRec

/*/{Protheus.doc} MI9GEST
Usuário logado pode aprovar e gerenciar: administrador do Protheus ou recurso marcado como gestor.
/*/
User Function MI9GEST()
	Local cRec := U_MI9MREC()
	If FWIsAdmin(__cUserId)
		Return .T.
	EndIf
Return !Empty(cRec) .And. Posicione("ZM1", 1, xFilial("ZM1") + cRec, "ZM1_GESTOR") == "1"

// ---------------------------------------------------------------- Calendário

/*/{Protheus.doc} MI9FERS
Feriados entre as datas: nacionais calculados + adicionais da ZM9 - nacionais desconsiderados na ZM9.
Retorna JsonObject DTOS -> descrição.
/*/
User Function MI9FERS(dDe, dAte)
	Local oFer := JsonObject():New()
	Local oRem := JsonObject():New()
	Local aAdic := {}
	Local aFer := {}
	Local nAno := 0
	Local nI := 0
	Local cAli := ""
	cAli := Abre("SELECT ZM9_DATA, ZM9_DESCR, ZM9_TIPO FROM " + RetSqlName("ZM9") + ;
		" WHERE ZM9_FILIAL = '" + xFilial("ZM9") + "' AND D_E_L_E_T_ = ' '" + ;
		" AND ZM9_DATA BETWEEN '" + DToS(dDe) + "' AND '" + DToS(dAte) + "'")
	While !(cAli)->(Eof())
		If (cAli)->ZM9_TIPO == "1"
			aAdd(aAdic, {(cAli)->ZM9_DATA, AllTrim((cAli)->ZM9_DESCR)})
		Else
			oRem[(cAli)->ZM9_DATA] := .T.
		EndIf
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())
	For nAno := Year(dDe) To Year(dAte)
		aFer := U_MI9FER(nAno)
		For nI := 1 To Len(aFer)
			If !U_MI9TEM(oRem, DToS(aFer[nI][1]))
				oFer[DToS(aFer[nI][1])] := aFer[nI][2]
			EndIf
		Next nI
	Next nAno
	For nI := 1 To Len(aAdic)
		oFer[aAdic[nI][1]] := aAdic[nI][2]
	Next nI
Return oFer

/*/{Protheus.doc} MI9AUS
Ausências aprovadas (ZM2) por recurso: JsonObject recurso -> JsonObject DTOS -> horas indisponíveis no dia.
Dia inteiro (ZM2_HRDIA = 0) vira 999 h, limitado à jornada no cálculo da capacidade.
/*/
User Function MI9AUS()
	Local oAus := JsonObject():New()
	Local oDias
	Local cAli := ""
	Local cRec := ""
	Local cK := ""
	Local dDia
	Local dFim
	Local nH := 0
	cAli := Abre("SELECT ZM2_RECURS, ZM2_INICIO, ZM2_FIM, ZM2_HRDIA FROM " + RetSqlName("ZM2") + ;
		" WHERE ZM2_FILIAL = '" + xFilial("ZM2") + "' AND D_E_L_E_T_ = ' ' AND ZM2_STATUS = '2'")
	While !(cAli)->(Eof())
		cRec := (cAli)->ZM2_RECURS
		If !U_MI9TEM(oAus, cRec)
			oAus[cRec] := JsonObject():New()
		EndIf
		oDias := oAus[cRec]
		nH := IIf((cAli)->ZM2_HRDIA > 0, (cAli)->ZM2_HRDIA, 999)
		dDia := SToD((cAli)->ZM2_INICIO)
		dFim := SToD((cAli)->ZM2_FIM)
		While dDia <= dFim
			If !U_MI9FIMS(dDia)
				cK := DToS(dDia)
				oDias[cK] := IIf(U_MI9TEM(oDias, cK), oDias[cK], 0) + nH
			EndIf
			dDia := dDia + 1
		EndDo
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())
Return oAus

/*/ Dias sem trabalho do recurso para o rateio: feriados + dias com ausência de jornada inteira. /*/
Static Function Indisp(cRec, oFer, oAus)
	Local oInd := JsonObject():New()
	Local aNomes := oFer:GetNames()
	Local nHDia := Posicione("ZM1", 1, xFilial("ZM1") + cRec, "ZM1_HSEM") / 5
	Local oDias
	Local nI := 0
	For nI := 1 To Len(aNomes)
		oInd[aNomes[nI]] := .T.
	Next nI
	If U_MI9TEM(oAus, cRec)
		oDias := oAus[cRec]
		aNomes := oDias:GetNames()
		For nI := 1 To Len(aNomes)
			If oDias[aNomes[nI]] >= nHDia
				oInd[aNomes[nI]] := .T.
			EndIf
		Next nI
	EndIf
Return oInd

// ---------------------------------------------------------------- Carga e capacidade

/*/{Protheus.doc} MI9CARG
Carga planejada da semana atual em diante.
- cronograma: o que falta de cada atribuição (esforço - realizado) rateado nos dias úteis do recurso;
- alocações avulsas (ZM7) da semana atual em diante.
Retorna {oTotal, oPorProjeto, oFeriados, oAusencias, aSemanaAtual}
  oTotal["RECURSO|2026-W40"] = horas; oPorProjeto["RECURSO|2026-W40|PROJETO"] = horas
/*/
User Function MI9CARG(dHoje)
	Local aAtual := U_MI9SEM(dHoje)
	Local dJan := aAtual[4]
	Local oTot := JsonObject():New()
	Local oPrj := JsonObject():New()
	Local oFer := U_MI9FERS(dJan - 400, dJan + 800)
	Local oAus := U_MI9AUS()
	Local oInd := JsonObject():New()
	Local aRat := {}
	Local cAli := ""
	Local cRec := ""
	Local nI := 0

	cAli := Abre("SELECT ZM4_PROJET, ZM4_INICIO, ZM4_FIM, ZM5_RECURS, ZM5_ESFORC, ZM5_REALIZ" + ;
		" FROM " + RetSqlName("ZM5") + " ZM5" + ;
		" INNER JOIN " + RetSqlName("ZM4") + " ZM4 ON ZM4_FILIAL = '" + xFilial("ZM4") + "' AND ZM4_PROJET = ZM5_PROJET" + ;
		" AND ZM4_ITEM = ZM5_ATIVID AND ZM4.D_E_L_E_T_ = ' '" + ;
		" INNER JOIN " + RetSqlName("ZM3") + " ZM3 ON ZM3_FILIAL = '" + xFilial("ZM3") + "' AND ZM3_COD = ZM4_PROJET AND ZM3.D_E_L_E_T_ = ' '" + ;
		" WHERE ZM5_FILIAL = '" + xFilial("ZM5") + "' AND ZM5.D_E_L_E_T_ = ' '" + ;
		" AND ZM4_STATUS NOT IN ('4','5') AND ZM3_STATUS NOT IN " + PRJ_SEM_CARGA + ;
		" AND ZM4_INICIO <> ' ' AND ZM4_FIM <> ' ' AND ZM5_ESFORC > ZM5_REALIZ")
	While !(cAli)->(Eof())
		cRec := (cAli)->ZM5_RECURS
		If !U_MI9TEM(oInd, cRec)
			oInd[cRec] := Indisp(cRec, oFer, oAus)
		EndIf
		aRat := U_MI9RAT(SToD((cAli)->ZM4_INICIO), SToD((cAli)->ZM4_FIM), (cAli)->ZM5_ESFORC - (cAli)->ZM5_REALIZ, dJan, oInd[cRec])
		For nI := 1 To Len(aRat)
			Soma(oTot, oPrj, cRec, aRat[nI][1], (cAli)->ZM4_PROJET, aRat[nI][2])
		Next nI
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())

	cAli := Abre("SELECT ZM7_RECURS, ZM7_SEMANA, ZM7_PROJET, ZM7_HORAS FROM " + RetSqlName("ZM7") + ;
		" WHERE ZM7_FILIAL = '" + xFilial("ZM7") + "' AND D_E_L_E_T_ = ' ' AND ZM7_SEMANA >= '" + aAtual[1] + "'")
	While !(cAli)->(Eof())
		Soma(oTot, oPrj, (cAli)->ZM7_RECURS, AllTrim((cAli)->ZM7_SEMANA), (cAli)->ZM7_PROJET, (cAli)->ZM7_HORAS)
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())
Return {oTot, oPrj, oFer, oAus, aAtual}

Static Function Soma(oTot, oPrj, cRec, cSem, cProj, nHoras)
	Local cK := cRec + "|" + cSem
	Local cKP := cK + "|" + cProj
	If nHoras <= 0
		Return Nil
	EndIf
	oTot[cK] := Round(IIf(U_MI9TEM(oTot, cK), oTot[cK], 0) + nHoras, 1)
	oPrj[cKP] := Round(IIf(U_MI9TEM(oPrj, cKP), oPrj[cKP], 0) + nHoras, 1)
Return Nil

/*/{Protheus.doc} MI9CEL
Célula recurso x semana. aCalc = retorno de U_MI9CARG; aSem = semana de U_MI9SEM.
Retorna {nHorasPlanejadas, nCapacidadeLiquida, aFaixa (U_MI9FAIXA), aCapacidade (U_MI9CAPS)}.
/*/
User Function MI9CEL(aCalc, cRec, nHSem, lAtivo, aSem)
	Local oTot := aCalc[1]
	Local oFer := aCalc[3]
	Local oAus := aCalc[4]
	Local oAusR := Nil
	Local cK := cRec + "|" + aSem[1]
	Local nH := IIf(U_MI9TEM(oTot, cK), oTot[cK], 0)
	Local aCap := {}
	If U_MI9TEM(oAus, cRec)
		oAusR := oAus[cRec]
	EndIf
	aCap := U_MI9CAPS(aSem[4], IIf(lAtivo, nHSem, 0), oFer, oAusR)
Return {nH, aCap[6], U_MI9FAIXA(nH, aCap[6]), aCap}

/*/{Protheus.doc} MI9CPRJ
Horas de um projeto na célula recurso x semana.
/*/
User Function MI9CPRJ(aCalc, cRec, cSem, cProj)
	Local oPrj := aCalc[2]
	Local cK := cRec + "|" + cSem + "|" + cProj
Return IIf(U_MI9TEM(oPrj, cK), oPrj[cK], 0)

// ---------------------------------------------------------------- Projeto

/*/{Protheus.doc} MI9INDP
Indicadores do projeto na data.
Retorna {nProgresso, nPrevisto, nRealizado, nForecast, nAtrasadas, nRiscosAltos, nRiscosAbertos,
         nPendenciasVencidas, nAtividades, nConcluidas, cSugestaoStatusExecutivo, nHorasVendidas}
/*/
User Function MI9INDP(cProj, dHoje)
	Local aItens := {}
	Local nPrev := 0
	Local nReal := 0
	Local nFcst := 0
	Local nAtras := 0
	Local nTotal := 0
	Local nConcl := 0
	Local nRiscA := 0
	Local nRiscB := 0
	Local nPendV := 0
	Local nVend := Posicione("ZM3", 1, xFilial("ZM3") + cProj, "ZM3_HRVEND")
	Local cAli := ""
	Local cSt := ""

	cAli := Abre("SELECT ZM4_ITEM, ZM4_STATUS, ZM4_PERC, ZM4_FIM," + ;
		" COALESCE(SUM(ZM5_ESFORC), 0) PREVISTO, COALESCE(SUM(ZM5_REALIZ), 0) REALIZADO," + ;
		" COALESCE(SUM(CASE WHEN ZM5_ESFORC > ZM5_REALIZ THEN ZM5_ESFORC - ZM5_REALIZ ELSE 0 END), 0) FALTA" + ;
		" FROM " + RetSqlName("ZM4") + " ZM4" + ;
		" LEFT JOIN " + RetSqlName("ZM5") + " ZM5 ON ZM5_FILIAL = '" + xFilial("ZM5") + "' AND ZM5_PROJET = ZM4_PROJET" + ;
		" AND ZM5_ATIVID = ZM4_ITEM AND ZM5.D_E_L_E_T_ = ' '" + ;
		" WHERE ZM4_FILIAL = '" + xFilial("ZM4") + "' AND ZM4.D_E_L_E_T_ = ' ' AND ZM4_PROJET = '" + cProj + "'" + ;
		" GROUP BY ZM4_ITEM, ZM4_STATUS, ZM4_PERC, ZM4_FIM")
	TcSetField(cAli, "PREVISTO", "N", 12, 1)
	TcSetField(cAli, "REALIZADO", "N", 12, 1)
	TcSetField(cAli, "FALTA", "N", 12, 1)
	While !(cAli)->(Eof())
		cSt := (cAli)->ZM4_STATUS
		aAdd(aItens, {(cAli)->PREVISTO, (cAli)->ZM4_PERC, cSt})
		If cSt <> "5"
			nTotal++
			nPrev += (cAli)->PREVISTO
			nReal += (cAli)->REALIZADO
			nFcst += (cAli)->REALIZADO + IIf(cSt == "4", 0, (cAli)->FALTA)
			If cSt == "4"
				nConcl++
			ElseIf U_MI9SITP(cSt, SToD((cAli)->ZM4_FIM), dHoje) == "A"
				nAtras++
			EndIf
		EndIf
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())

	cAli := Abre("SELECT ZM8_TIPO, ZM8_STATUS, ZM8_PRAZO, ZM8_PROB, ZM8_IMPACT FROM " + RetSqlName("ZM8") + ;
		" WHERE ZM8_FILIAL = '" + xFilial("ZM8") + "' AND D_E_L_E_T_ = ' ' AND ZM8_PROJET = '" + cProj + "'")
	While !(cAli)->(Eof())
		If U_MI9ABERT((cAli)->ZM8_STATUS)
			If (cAli)->ZM8_TIPO == "5"
				nRiscB++
				If (cAli)->ZM8_PROB * (cAli)->ZM8_IMPACT > 9
					nRiscA++
				EndIf
			EndIf
			If U_MI9VENC((cAli)->ZM8_STATUS, SToD((cAli)->ZM8_PRAZO), dHoje)
				nPendV++
			EndIf
		EndIf
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())
Return {U_MI9PROG(aItens), Round(nPrev, 1), Round(nReal, 1), Round(nFcst, 1), nAtras, nRiscA, nRiscB, nPendV, nTotal, nConcl, ;
	U_MI9SUGST({nAtras, nRiscA, nRiscB, nPendV, nFcst, nVend}), nVend}

/*/{Protheus.doc} MI9REAL
Recalcula as horas realizadas da atribuição (ZM5_REALIZ) pela soma dos apontamentos (ZM6).
Chamado na gravação do apontamento, dentro da mesma transação.
/*/
User Function MI9REAL(cProj, cAtiv, cRec)
	Local aArea := GetArea()
	Local nHoras := 0
	Local cAli := Abre("SELECT COALESCE(SUM(ZM6_HORAS), 0) HORAS FROM " + RetSqlName("ZM6") + ;
		" WHERE ZM6_FILIAL = '" + xFilial("ZM6") + "' AND D_E_L_E_T_ = ' '" + ;
		" AND ZM6_PROJET = '" + cProj + "' AND ZM6_ATIVID = '" + cAtiv + "' AND ZM6_RECURS = '" + cRec + "'")
	TcSetField(cAli, "HORAS", "N", 12, 1)
	nHoras := (cAli)->HORAS
	(cAli)->(DbCloseArea())
	DbSelectArea("ZM5")
	ZM5->(DbSetOrder(1))
	If ZM5->(DbSeek(xFilial("ZM5") + cProj + cAtiv + cRec))
		RecLock("ZM5", .F.)
		ZM5->ZM5_REALIZ := nHoras
		ZM5->(MsUnlock())
	EndIf
	RestArea(aArea)
Return nHoras

// ---------------------------------------------------------------- Alertas

/*/{Protheus.doc} MI9ALER
Alertas da data (mesmas regras do app). Cada alerta tem uma chave estável: a mesma situação gera a mesma chave
todo dia, o que permite avisar por e-mail uma vez só.
Retorna {{cChave, cTipo, cGravidade, cTitulo, cDetalhe, aRecursos, lGestores, cProjeto}, ...}
Tipos: 1=Atividade atrasada 2=Pendência vencida 3=Recurso sobrecarregado 4=Indisponibilidade a aprovar
/*/
User Function MI9ALER(dHoje)
	Local aAle := {}
	Local aRecs := {}
	Local aCalc := {}
	Local aSems := {}
	Local aCel := {}
	Local cAli := ""
	Local cAli2 := ""
	Local cProj := ""
	Local nDias := 0
	Local nPct := 0
	Local nI := 0
	Local nSem := Max(1, SuperGetMV("MV_MI9DIAS", .F., 2))

	// 1. Atividades atrasadas de projetos ativos
	cAli := Abre("SELECT ZM4_PROJET, ZM4_ITEM, ZM4_TAREFA, ZM4_FIM, ZM3_NOME, ZM3_GP, COALESCE(A1_NREDUZ, ' ') CLIENTE" + ;
		" FROM " + RetSqlName("ZM4") + " ZM4" + ;
		" INNER JOIN " + RetSqlName("ZM3") + " ZM3 ON ZM3_FILIAL = '" + xFilial("ZM3") + "' AND ZM3_COD = ZM4_PROJET AND ZM3.D_E_L_E_T_ = ' '" + ;
		" LEFT JOIN " + RetSqlName("SA1") + " SA1 ON A1_FILIAL = '" + xFilial("SA1") + "' AND A1_COD = ZM3_CLIENT AND A1_LOJA = ZM3_LOJA AND SA1.D_E_L_E_T_ = ' '" + ;
		" WHERE ZM4_FILIAL = '" + xFilial("ZM4") + "' AND ZM4.D_E_L_E_T_ = ' '" + ;
		" AND ZM3_STATUS IN " + PRJ_ATIVOS + " AND ZM4_STATUS NOT IN ('4','5')" + ;
		" AND ZM4_FIM <> ' ' AND ZM4_FIM < '" + DToS(dHoje) + "'")
	While !(cAli)->(Eof())
		cProj := (cAli)->ZM4_PROJET
		nDias := dHoje - SToD((cAli)->ZM4_FIM)
		aRecs := {}
		cAli2 := Abre("SELECT ZM5_RECURS FROM " + RetSqlName("ZM5") + " WHERE ZM5_FILIAL = '" + xFilial("ZM5") + "' AND D_E_L_E_T_ = ' '" + ;
			" AND ZM5_PROJET = '" + cProj + "' AND ZM5_ATIVID = '" + (cAli)->ZM4_ITEM + "'")
		While !(cAli2)->(Eof())
			aAdd(aRecs, (cAli2)->ZM5_RECURS)
			(cAli2)->(DbSkip())
		EndDo
		(cAli2)->(DbCloseArea())
		AddRec(aRecs, (cAli)->ZM3_GP)
		aAdd(aAle, {"ATIVIDADE_ATRASADA:" + cProj + "-" + (cAli)->ZM4_ITEM + ":" + (cAli)->ZM4_FIM, "1", IIf(nDias > 5, "ALTA", "MEDIA"), ;
			cProj + "-" + (cAli)->ZM4_ITEM + " · " + AllTrim((cAli)->ZM4_TAREFA), ;
			AllTrim((cAli)->CLIENTE) + " · " + AllTrim((cAli)->ZM3_NOME) + " - fim previsto " + DToC(SToD((cAli)->ZM4_FIM)) + ;
			" (" + cValToChar(nDias) + " dia(s) de atraso)", aRecs, .F., cProj})
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())

	// 2. Pendências vencidas (qualquer item operacional aberto com prazo vencido) de projetos ativos
	cAli := Abre("SELECT ZM8_PROJET, ZM8_ITEM, ZM8_TIPO, ZM8_DESCR, ZM8_PRAZO, ZM8_RESP, ZM3_NOME, ZM3_GP, COALESCE(A1_NREDUZ, ' ') CLIENTE" + ;
		" FROM " + RetSqlName("ZM8") + " ZM8" + ;
		" INNER JOIN " + RetSqlName("ZM3") + " ZM3 ON ZM3_FILIAL = '" + xFilial("ZM3") + "' AND ZM3_COD = ZM8_PROJET AND ZM3.D_E_L_E_T_ = ' '" + ;
		" LEFT JOIN " + RetSqlName("SA1") + " SA1 ON A1_FILIAL = '" + xFilial("SA1") + "' AND A1_COD = ZM3_CLIENT AND A1_LOJA = ZM3_LOJA AND SA1.D_E_L_E_T_ = ' '" + ;
		" WHERE ZM8_FILIAL = '" + xFilial("ZM8") + "' AND ZM8.D_E_L_E_T_ = ' '" + ;
		" AND ZM3_STATUS IN " + PRJ_ATIVOS + " AND ZM8_STATUS IN ('1','2','3','4')" + ;
		" AND ZM8_PRAZO <> ' ' AND ZM8_PRAZO < '" + DToS(dHoje) + "'")
	While !(cAli)->(Eof())
		cProj := (cAli)->ZM8_PROJET
		nDias := dHoje - SToD((cAli)->ZM8_PRAZO)
		aRecs := {}
		AddRec(aRecs, (cAli)->ZM8_RESP)
		AddRec(aRecs, (cAli)->ZM3_GP)
		aAdd(aAle, {"PENDENCIA_VENCIDA:" + cProj + "-" + (cAli)->ZM8_ITEM + ":" + (cAli)->ZM8_PRAZO, "2", ;
			IIf(nDias > 5 .Or. (cAli)->ZM8_TIPO $ "57", "ALTA", "MEDIA"), ;
			cProj + "-" + (cAli)->ZM8_ITEM + " · " + AllTrim(Left((cAli)->ZM8_DESCR, 80)), ;
			AllTrim((cAli)->CLIENTE) + " · " + AllTrim((cAli)->ZM3_NOME) + " - prazo " + DToC(SToD((cAli)->ZM8_PRAZO)) + ;
			" (" + cValToChar(nDias) + " dia(s) vencido)", aRecs, .F., cProj})
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())

	// 3. Sobrecarga nas próximas semanas (utilização acima de 100%)
	aCalc := U_MI9CARG(dHoje)
	aSems := U_MI9SEMS(aCalc[5][4], aCalc[5][4] + 7 * nSem - 1)
	cAli := Abre("SELECT ZM1_COD, ZM1_NOME, ZM1_HSEM FROM " + RetSqlName("ZM1") + ;
		" WHERE ZM1_FILIAL = '" + xFilial("ZM1") + "' AND D_E_L_E_T_ = ' ' AND ZM1_ATIVO = '1'")
	While !(cAli)->(Eof())
		For nI := 1 To Len(aSems)
			aCel := U_MI9CEL(aCalc, (cAli)->ZM1_COD, (cAli)->ZM1_HSEM, .T., aSems[nI])
			If aCel[1] > aCel[2] .And. aCel[1] > 0
				nPct := IIf(aCel[2] > 0, Round(aCel[1] / aCel[2] * 100, 0), 0)
				aAdd(aAle, {"SOBRECARGA:" + (cAli)->ZM1_COD + ":" + aSems[nI][1], "3", IIf(nPct == 0 .Or. nPct > 120, "ALTA", "MEDIA"), ;
					AllTrim((cAli)->ZM1_NOME) + " em " + IIf(nPct == 0, "semana sem capacidade", cValToChar(nPct) + "%") + " na " + U_MI9ROT(aSems[nI]), ;
					cValToChar(aCel[1]) + "h planejadas para " + cValToChar(aCel[2]) + "h de capacidade líquida", {(cAli)->ZM1_COD}, .T., ""})
			EndIf
		Next nI
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())

	// 4. Indisponibilidades aguardando aprovação
	cAli := Abre("SELECT ZM2_RECURS, ZM2_ITEM, ZM2_TIPO, ZM2_INICIO, ZM2_FIM FROM " + RetSqlName("ZM2") + ;
		" WHERE ZM2_FILIAL = '" + xFilial("ZM2") + "' AND D_E_L_E_T_ = ' ' AND ZM2_STATUS = '1'")
	While !(cAli)->(Eof())
		aAdd(aAle, {"INDISPONIBILIDADE_PENDENTE:" + (cAli)->ZM2_RECURS + "-" + (cAli)->ZM2_ITEM, "4", "MEDIA", ;
			AllTrim(Posicione("ZM1", 1, xFilial("ZM1") + (cAli)->ZM2_RECURS, "ZM1_NOME")) + " · " + ;
			AllTrim(X3Combo("ZM2_TIPO", (cAli)->ZM2_TIPO)), ;
			DToC(SToD((cAli)->ZM2_INICIO)) + " a " + DToC(SToD((cAli)->ZM2_FIM)) + " aguardando aprovação", {}, .T., ""})
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())

	// Gravidade alta primeiro, depois tipo e título
	aSort(aAle, , , {|x, y| IIf(x[3] == y[3], IIf(x[2] == y[2], x[4] < y[4], x[2] < y[2]), x[3] == "ALTA")})
Return aAle

/*/{Protheus.doc} MI9TPAL
Texto do tipo de alerta.
/*/
User Function MI9TPAL(cTipo)
	Local aTxt := {"Atividade atrasada", "Pendência vencida", "Recurso sobrecarregado", "Indisponibilidade a aprovar"}
	Local nTipo := Val(cTipo)
Return IIf(nTipo >= 1 .And. nTipo <= Len(aTxt), aTxt[nTipo], "")

Static Function AddRec(aRecs, cRec)
	If !Empty(cRec) .And. aScan(aRecs, {|x| x == cRec}) == 0
		aAdd(aRecs, cRec)
	EndIf
Return Nil

// ---------------------------------------------------------------- Consulta SQL

/*/ Abre uma consulta somente leitura e devolve o alias. Quem abre fecha com DbCloseArea(). /*/
Static Function Abre(cSql)
	Local cAli := GetNextAlias()
	DbUseArea(.T., "TOPCONN", TcGenQry(, , ChangeQuery(cSql)), cAli, .F., .T.)
Return cAli
