#Include "Protheus.ch"

/*/{Protheus.doc} MI9TST
Testes das regras de cálculo (MI9DOM), com os mesmos casos dos testes do app web (tests/domain).
Não acessa tabelas. Rodar pelo menu ou como programa inicial no SmartClient: U_MI9TST.
Resultado no console do AppServer e numa mensagem ao final.
@author MAIS i9
/*/
User Function MI9TST()
	Local aRes := {0, 0, ""}
	Local dS40 := SToD("20260928")
	Local aR := {}
	Local aC := {}
	Local oInd := JsonObject():New()
	Local oFer := JsonObject():New()
	Local nSoma := 0
	Local nI := 0

	// Semanas ISO
	Igual(aRes, "semana de 01/10/2026", U_MI9SEM(SToD("20261001"))[1], "2026-W40")
	Igual(aRes, "início da W40", DToS(U_MI9SEM(SToD("20261001"))[4]), "20260928")
	Igual(aRes, "fim da W40", DToS(U_MI9SEM(SToD("20261001"))[5]), "20261004")
	Igual(aRes, "31/12/2026 é W53", U_MI9SEM(SToD("20261231"))[1], "2026-W53")
	Igual(aRes, "04/01/2027 é W01", U_MI9SEM(SToD("20270104"))[1], "2027-W01")
	Igual(aRes, "01/01/2027 pertence a 2026", U_MI9SEM(SToD("20270101"))[1], "2026-W53")
	Igual(aRes, "03/01/2021 pertence a 2020", U_MI9SEM(SToD("20210103"))[1], "2020-W53")
	Igual(aRes, "domingo fecha a semana", U_MI9SEM(SToD("20261004"))[1], "2026-W40")
	Igual(aRes, "segunda abre a seguinte", U_MI9SEM(SToD("20261005"))[1], "2026-W41")
	Igual(aRes, "semana por id W40", DToS(U_MI9SEMI("2026-W40")[4]), "20260928")
	Igual(aRes, "semana por id W53", DToS(U_MI9SEMI("2026-W53")[4]), "20261228")
	Igual(aRes, "id inválido", U_MI9SEMI("2025-W53") == Nil, .T.)
	Igual(aRes, "rótulo", U_MI9ROT(U_MI9SEM(SToD("20261001"))), "S40/26")
	Igual(aRes, "semanas entre", Len(U_MI9SEMS(SToD("20260930"), SToD("20261013"))), 3)

	// Feriados
	Igual(aRes, "Páscoa 2024", DToS(U_MI9PASC(2024)), "20240331")
	Igual(aRes, "Páscoa 2025", DToS(U_MI9PASC(2025)), "20250420")
	Igual(aRes, "Páscoa 2026", DToS(U_MI9PASC(2026)), "20260405")
	Igual(aRes, "Carnaval 2026", DToS(U_MI9FER(2026)[2][1]), "20260216")
	Igual(aRes, "Corpus Christi 2026", DToS(U_MI9FER(2026)[7][1]), "20260604")
	Igual(aRes, "13 feriados", Len(U_MI9FER(2026)), 13)

	// Rateio (mesmos casos de tests/domain/cronograma.test.ts)
	aR := U_MI9RAT(SToD("20260930"), SToD("20261013"), 40, dS40, Nil)
	Igual(aRes, "rateio proporcional", Rat(aR), "2026-W40=12;2026-W41=20;2026-W42=8")
	aR := U_MI9RAT(SToD("20261028"), SToD("20261103"), 4, dS40, Nil)
	Igual(aRes, "rateio arredonda 0,5 e acerta na última", Rat(aR), "2026-W44=2.5;2026-W45=1.5")
	oInd["20261012"] := .T.
	aR := U_MI9RAT(SToD("20261012"), SToD("20261013"), 8, dS40, oInd)
	Igual(aRes, "rateio pula feriado", Rat(aR), "2026-W42=8")
	aR := U_MI9RAT(SToD("20260921"), SToD("20261002"), 10, dS40, Nil)
	Igual(aRes, "rateio começa na semana atual", Rat(aR), "2026-W40=10")
	aR := U_MI9RAT(SToD("20260914"), SToD("20260918"), 6, dS40, Nil)
	Igual(aRes, "atividade vencida vai para a semana atual", Rat(aR), "2026-W40=6")
	aR := U_MI9RAT(SToD("20261009"), SToD("20261010"), 8, dS40, Nil)
	Igual(aRes, "fim de semana não conta", Rat(aR), "2026-W41=8")
	aR := U_MI9RAT(SToD("20261012"), SToD("20261012"), 4, dS40, oInd)
	Igual(aRes, "só feriado no período: ignora o feriado", Rat(aR), "2026-W42=4")
	Igual(aRes, "zero horas", Len(U_MI9RAT(SToD("20261012"), SToD("20261013"), 0, dS40, Nil)), 0)
	aR := U_MI9RAT(SToD("20261001"), SToD("20261120"), 37, dS40, Nil)
	For nI := 1 To Len(aR)
		nSoma += aR[nI][2]
	Next nI
	Igual(aRes, "soma do rateio bate", Round(nSoma, 1), 37)

	// Capacidade
	aC := U_MI9CAPS(dS40, 40, Nil, Nil)
	Igual(aRes, "semana sem feriado", aC[6], 40)
	Igual(aRes, "dias úteis", aC[2], 5)
	oFer["20261012"] := "Nossa Senhora Aparecida"
	Igual(aRes, "feriado na segunda (40h)", U_MI9CAPS(SToD("20261012"), 40, oFer, Nil)[6], 32)
	Igual(aRes, "feriado na segunda (30h)", U_MI9CAPS(SToD("20261012"), 30, oFer, Nil)[6], 24)
	oFer["20261115"] := "Proclamação da República"
	Igual(aRes, "feriado no domingo não reduz", U_MI9CAPS(SToD("20261109"), 40, oFer, Nil)[6], 40)

	// Faixas
	Igual(aRes, "faixa sobrecarregado", U_MI9FAIXA(41, 40)[1], "S")
	Igual(aRes, "faixa atenção", U_MI9FAIXA(34, 40)[1], "A")
	Igual(aRes, "faixa disponível", U_MI9FAIXA(19, 40)[1], "D")
	Igual(aRes, "faixa adequado", U_MI9FAIXA(20, 40)[1], "Q")
	Igual(aRes, "sem capacidade com carga", U_MI9FAIXA(4, 0)[1], "S")

	// Prazo
	Igual(aRes, "concluída", U_MI9SITP("4", SToD("20260901"), SToD("20261001")), "C")
	Igual(aRes, "atrasada", U_MI9SITP("2", SToD("20260930"), SToD("20261001")), "A")
	Igual(aRes, "vence hoje = atenção", U_MI9SITP("1", SToD("20261001"), SToD("20261001")), "T")
	Igual(aRes, "vence em 3 dias = atenção", U_MI9SITP("1", SToD("20261004"), SToD("20261001")), "T")
	Igual(aRes, "vence em 4 dias = no prazo", U_MI9SITP("1", SToD("20261005"), SToD("20261001")), "N")
	Igual(aRes, "cancelada sem situação", U_MI9SITP("5", SToD("20260901"), SToD("20261001")), "")

	// Progresso e coerência
	Igual(aRes, "progresso ponderado", U_MI9PROG({{8, 50, "2"}, {2, 100, "4"}, {30, 0, "5"}}), 60)
	Igual(aRes, "progresso sem esforço = média", U_MI9PROG({{0, 50, "2"}, {0, 0, "1"}}), 25)
	Igual(aRes, "concluída = 100%", U_MI9COER("4", 40)[2], 100)
	Igual(aRes, "100% = concluída", U_MI9COER("2", 100)[1], "4")
	Igual(aRes, "% em não iniciada = em andamento", U_MI9COER("1", 25)[1], "2")
	Igual(aRes, "bloqueada mantém", U_MI9COER("3", 30)[1], "3")

	// Severidade e itens
	Igual(aRes, "severidade baixa", U_MI9SEVER(2, 2), "BAIXA")
	Igual(aRes, "severidade média", U_MI9SEVER(3, 3), "MEDIA")
	Igual(aRes, "severidade alta", U_MI9SEVER(3, 5), "ALTA")
	Igual(aRes, "severidade crítica", U_MI9SEVER(4, 5), "CRITICA")
	Igual(aRes, "sem P x I", U_MI9SEVER(0, 5), "")
	Igual(aRes, "item vencido", U_MI9VENC("1", SToD("20260930"), SToD("20261001")), .T.)
	Igual(aRes, "item fechado não vence", U_MI9VENC("7", SToD("20260930"), SToD("20261001")), .F.)

	// Status executivo sugerido {atrasadas, riscos altos, riscos abertos, pend. vencidas, forecast, vendidas}
	Igual(aRes, "sugestão verde", U_MI9SUGST({0, 0, 0, 0, 100, 120}), "1")
	Igual(aRes, "sugestão amarelo", U_MI9SUGST({1, 0, 0, 0, 100, 120}), "2")
	Igual(aRes, "sugestão vermelho por estouro", U_MI9SUGST({0, 0, 0, 0, 130, 120}), "3")

	aRes[3] := "Testes MAIS i9: " + cValToChar(aRes[1]) + " ok, " + cValToChar(aRes[2]) + " falha(s)." + aRes[3]
	ConOut(aRes[3])
	If !IsBlind()
		If aRes[2] == 0
			MsgInfo(aRes[3], "MI9TST")
		Else
			MsgStop(aRes[3], "MI9TST")
		EndIf
	EndIf
Return aRes[2] == 0

Static Function Igual(aRes, cCaso, xObtido, xEsperado)
	If ValType(xObtido) == ValType(xEsperado) .And. xObtido == xEsperado
		aRes[1]++
	Else
		aRes[2]++
		aRes[3] += CRLF + "FALHOU: " + cCaso + " - esperado " + cValToChar(xEsperado) + ", obtido " + cValToChar(xObtido)
	EndIf
Return Nil

/*/ Rateio em texto: "2026-W40=12;2026-W41=20" /*/
Static Function Rat(aR)
	Local cRet := ""
	Local nI := 0
	For nI := 1 To Len(aR)
		cRet += IIf(nI > 1, ";", "") + aR[nI][1] + "=" + cValToChar(aR[nI][2])
	Next nI
Return cRet
