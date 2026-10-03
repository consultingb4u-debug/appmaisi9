#Include "Protheus.ch"

/*/{Protheus.doc} MI9DOM
Regras de cálculo da gestão de projetos MAIS i9 (funções puras, sem acesso a tabelas).
São as mesmas regras do app web (lib/domain): semanas ISO, feriados, dias úteis,
rateio de horas, capacidade líquida, faixas de utilização, prazos, progresso e severidade.
Testes: U_MI9TST.

Códigos usados:
  Status da atividade (ZM4_STATUS): 1=Não iniciado 2=Em andamento 3=Bloqueado 4=Concluído 5=Cancelado
  Status do item operacional (ZM8_STATUS): 1=Aberto 2=Em andamento 3=Aguardando 4=Bloqueado
                                           5=Aprovado 6=Reprovado 7=Fechado 8=Cancelado
  Situação do prazo: C=Concluído A=Atrasado T=Atenção (vence em até 3 dias) N=No prazo
@author MAIS i9
/*/

// ---------------------------------------------------------------- Datas e semanas

/*/{Protheus.doc} MI9DOW
Dia da semana ISO: 1 = segunda ... 7 = domingo.
/*/
User Function MI9DOW(dData)
	Local nDia := Dow(dData) - 1
	If nDia == 0
		nDia := 7
	EndIf
Return nDia

/*/{Protheus.doc} MI9FIMS
Indica se a data cai no sábado ou domingo.
/*/
User Function MI9FIMS(dData)
Return U_MI9DOW(dData) >= 6

/*/{Protheus.doc} MI9SEM
Semana ISO 8601 que contém a data (a semana pertence ao ano da sua quinta-feira).
Retorna {cId, nAnoIso, nNumero, dSegunda, dDomingo}. Ex.: {"2026-W40", 2026, 40, 28/09/2026, 04/10/2026}
/*/
User Function MI9SEM(dData)
	Local dIni := dData - (U_MI9DOW(dData) - 1)
	Local dQui := dIni + 3
	Local nAno := Year(dQui)
	Local dJan4 := SToD(StrZero(nAno, 4) + "0104")
	Local dQui1 := dJan4 - (U_MI9DOW(dJan4) - 1) + 3
	Local nNum := Int((dQui - dQui1) / 7) + 1
Return {StrZero(nAno, 4) + "-W" + StrZero(nNum, 2), nAno, nNum, dIni, dIni + 6}

/*/{Protheus.doc} MI9SEMI
Semana a partir do identificador "AAAA-Wnn". Retorna Nil se o identificador for inválido.
/*/
User Function MI9SEMI(cId)
	Local nAno := 0
	Local nNum := 0
	Local dJan4
	Local aSem
	cId := AllTrim(cId)
	If Len(cId) <> 8 .Or. SubStr(cId, 5, 2) <> "-W" .Or. !IsDigit(Left(cId, 4)) .Or. !IsDigit(Right(cId, 2))
		Return Nil
	EndIf
	nAno := Val(Left(cId, 4))
	nNum := Val(Right(cId, 2))
	If nNum < 1
		Return Nil
	EndIf
	dJan4 := SToD(StrZero(nAno, 4) + "0104")
	aSem := U_MI9SEM(dJan4 - (U_MI9DOW(dJan4) - 1) + (nNum - 1) * 7)
	If aSem[2] <> nAno .Or. aSem[3] <> nNum
		Return Nil
	EndIf
Return aSem

/*/{Protheus.doc} MI9SEMV
Validação de campo: identificador de semana ISO válido ("2026-W40").
/*/
User Function MI9SEMV(cId)
	If U_MI9SEMI(cId) == Nil
		Help(, , "MI9SEMV", , "Semana inválida. Use o formato AAAA-Wnn, por exemplo 2026-W40.", 1, 0)
		Return .F.
	EndIf
Return .T.

/*/{Protheus.doc} MI9SEMS
Todas as semanas ISO que tocam o intervalo [dDe, dAte].
/*/
User Function MI9SEMS(dDe, dAte)
	Local aRet := {}
	Local dSeg := dDe - (U_MI9DOW(dDe) - 1)
	While dSeg <= dAte
		aAdd(aRet, U_MI9SEM(dSeg))
		dSeg := dSeg + 7
	EndDo
Return aRet

/*/{Protheus.doc} MI9ROT
Rótulo curto da semana, igual às planilhas: "S40/26".
/*/
User Function MI9ROT(aSem)
Return "S" + StrZero(aSem[3], 2) + "/" + Right(StrZero(aSem[2], 4), 2)

/*/{Protheus.doc} MI9TEM
Indica se o JsonObject usado como conjunto/mapa possui a chave.
/*/
User Function MI9TEM(oMapa, cChave)
	If ValType(oMapa) == "U"
		Return .F.
	EndIf
Return ValType(oMapa[cChave]) <> "U"

// ---------------------------------------------------------------- Feriados

/*/{Protheus.doc} MI9PASC
Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
/*/
User Function MI9PASC(nAno)
	Local nA := Mod(nAno, 19)
	Local nB := Int(nAno / 100)
	Local nC := Mod(nAno, 100)
	Local nD := Int(nB / 4)
	Local nE := Mod(nB, 4)
	Local nF := Int((nB + 8) / 25)
	Local nG := Int((nB - nF + 1) / 3)
	Local nH := Mod(19 * nA + nB - nD - nG + 15, 30)
	Local nI := Int(nC / 4)
	Local nK := Mod(nC, 4)
	Local nL := Mod(32 + 2 * nE + 2 * nI - nH - nK, 7)
	Local nM := Int((nA + 11 * nH + 22 * nL) / 451)
	Local nMes := Int((nH + nL - 7 * nM + 114) / 31)
	Local nDia := Mod(nH + nL - 7 * nM + 114, 31) + 1
Return SToD(StrZero(nAno, 4) + StrZero(nMes, 2) + StrZero(nDia, 2))

/*/{Protheus.doc} MI9FER
Feriados nacionais e pontos facultativos usuais (Carnaval, Corpus Christi) do ano.
Retorna {{dData, cDescricao}, ...}. Pontos facultativos podem ser removidos no cadastro de feriados (ZM9).
/*/
User Function MI9FER(nAno)
	Local dPas := U_MI9PASC(nAno)
	Local cAno := StrZero(nAno, 4)
Return { ;
	{SToD(cAno + "0101"), "Confraternização Universal"}, ;
	{dPas - 48, "Carnaval (ponto facultativo)"}, ;
	{dPas - 47, "Carnaval (ponto facultativo)"}, ;
	{dPas - 2, "Sexta-feira Santa"}, ;
	{SToD(cAno + "0421"), "Tiradentes"}, ;
	{SToD(cAno + "0501"), "Dia do Trabalho"}, ;
	{dPas + 60, "Corpus Christi (ponto facultativo)"}, ;
	{SToD(cAno + "0907"), "Independência do Brasil"}, ;
	{SToD(cAno + "1012"), "Nossa Senhora Aparecida"}, ;
	{SToD(cAno + "1102"), "Finados"}, ;
	{SToD(cAno + "1115"), "Proclamação da República"}, ;
	{SToD(cAno + "1120"), "Dia Nacional de Zumbi e da Consciência Negra"}, ;
	{SToD(cAno + "1225"), "Natal"} }

// ---------------------------------------------------------------- Cronograma

/*/{Protheus.doc} MI9DUT
Dias úteis entre as datas (inclusive), sem fins de semana e sem os dias do mapa oIndisp (chave DTOS).
/*/
User Function MI9DUT(dIni, dFim, oIndisp)
	Local aDias := {}
	Local dDia := dIni
	While dDia <= dFim
		If !U_MI9FIMS(dDia) .And. !U_MI9TEM(oIndisp, DToS(dDia))
			aAdd(aDias, dDia)
		EndIf
		dDia := dDia + 1
	EndDo
Return aDias

/*/{Protheus.doc} MI9RAT
Distribui as horas de uma atribuição nas semanas (mesma regra do app):
- período = de max(início, segunda da semana atual) até o fim previsto;
- proporcional aos dias úteis do recurso (sem fins de semana, feriados e ausências);
- arredonda em 0,5 h e acerta a diferença na última semana;
- atividade já vencida e não concluída: o que falta vai para a semana atual;
- sem nenhum dia útil: ignora feriados/ausências; se ainda assim não houver, usa a semana do fim.
Retorna {{cSemanaId, nHoras}, ...} só com semanas > 0.
/*/
User Function MI9RAT(dIni, dFim, nHoras, dJanela, oIndisp)
	Local aRet := {}
	Local aSem := {}
	Local aDias := {}
	Local dDe
	Local cId := ""
	Local nPos := 0
	Local nI := 0
	Local nH := 0
	Local nDist := 0

	If nHoras <= 0
		Return {}
	EndIf
	If dFim < dJanela
		nH := Meia(nHoras)
		Return {{U_MI9SEM(dJanela)[1], IIf(nH > 0, nH, nHoras)}}
	EndIf
	dDe := IIf(dIni > dJanela, dIni, dJanela)
	aDias := U_MI9DUT(dDe, dFim, oIndisp)
	If Len(aDias) == 0
		aDias := U_MI9DUT(dDe, dFim, Nil)
	EndIf
	If Len(aDias) == 0
		Return {{U_MI9SEM(dFim)[1], nHoras}}
	EndIf

	For nI := 1 To Len(aDias)
		cId := U_MI9SEM(aDias[nI])[1]
		nPos := aScan(aSem, {|x| x[1] == cId})
		If nPos == 0
			aAdd(aSem, {cId, 1})
		Else
			aSem[nPos][2]++
		EndIf
	Next nI

	For nI := 1 To Len(aSem)
		If nI == Len(aSem)
			nH := Max(0, Round(nHoras - nDist, 1))
		Else
			nH := Meia(nHoras * aSem[nI][2] / Len(aDias))
		EndIf
		nDist += nH
		If nH > 0
			aAdd(aRet, {aSem[nI][1], nH})
		EndIf
	Next nI
Return aRet

Static Function Meia(nValor)
Return Round(nValor * 2, 0) / 2

/*/{Protheus.doc} MI9SITP
Situação do prazo (fórmula do CTRL-001): concluída; vencida = atrasada; vence em até 3 dias = atenção; senão no prazo.
Retorna C, A, T, N ou "" (cancelada ou sem data de fim).
/*/
User Function MI9SITP(cStatus, dFim, dHoje)
	Local nDias := 0
	If cStatus == "4"
		Return "C"
	EndIf
	If cStatus == "5" .Or. Empty(dFim)
		Return ""
	EndIf
	nDias := dFim - dHoje
	If nDias < 0
		Return "A"
	ElseIf nDias <= 3
		Return "T"
	EndIf
Return "N"

/*/{Protheus.doc} MI9SITX
Texto da situação do prazo.
/*/
User Function MI9SITX(cSit)
	Local cTxt := ""
	Do Case
		Case cSit == "C"
			cTxt := "Concluído"
		Case cSit == "A"
			cTxt := "Atrasado"
		Case cSit == "T"
			cTxt := "Atenção"
		Case cSit == "N"
			cTxt := "No prazo"
	EndCase
Return cTxt

/*/{Protheus.doc} MI9PROG
Progresso ponderado pelo esforço previsto (decisão de negócio); sem esforço algum, média simples.
Atividades canceladas não contam. aItens = {{nPrevisto, nPercentual, cStatus}, ...}
/*/
User Function MI9PROG(aItens)
	Local nI := 0
	Local nQtd := 0
	Local nPeso := 0
	Local nSomaP := 0
	Local nSomaS := 0
	For nI := 1 To Len(aItens)
		If aItens[nI][3] <> "5"
			nQtd++
			nPeso += aItens[nI][1]
			nSomaP += aItens[nI][1] * aItens[nI][2]
			nSomaS += aItens[nI][2]
		EndIf
	Next nI
	If nQtd == 0
		Return 0
	EndIf
Return Round(IIf(nPeso > 0, nSomaP / nPeso, nSomaS / nQtd), 1)

/*/{Protheus.doc} MI9COER
Status e % andam juntos: concluída = 100%; 100% = concluída; % > 0 em "não iniciada" = em andamento.
Retorna {cStatus, nPercentual}.
/*/
User Function MI9COER(cStatus, nPerc)
	Local nPct := Max(0, Min(100, Round(nPerc, 0)))
	If cStatus == "4"
		Return {"4", 100}
	EndIf
	If nPct == 100 .And. cStatus <> "5"
		Return {"4", 100}
	EndIf
	If nPct > 0 .And. cStatus == "1"
		Return {"2", nPct}
	EndIf
Return {cStatus, nPct}

// ---------------------------------------------------------------- Capacidade

/*/{Protheus.doc} MI9CAPS
Capacidade líquida da semana (segunda a domingo):
bruta - feriados em dia útil x horas/dia - indisponibilidades aprovadas.
oFer: mapa DTOS -> descrição; oAus: mapa DTOS -> horas indisponíveis no dia (feriado não desconta duas vezes).
Retorna {nBruta, nDiasUteis, nDiasFeriado, nHorasFeriado, nHorasIndisp, nLiquida}.
/*/
User Function MI9CAPS(dIniSem, nHSem, oFer, oAus)
	Local nHDia := nHSem / 5
	Local nDFer := 0
	Local nHInd := 0
	Local nI := 0
	Local dDia
	Local cK := ""
	For nI := 0 To 6
		dDia := dIniSem + nI
		If U_MI9FIMS(dDia)
			Loop
		EndIf
		cK := DToS(dDia)
		If U_MI9TEM(oFer, cK)
			nDFer++
		ElseIf U_MI9TEM(oAus, cK)
			nHInd += Min(nHDia, oAus[cK])
		EndIf
	Next nI
Return {nHSem, 5 - nDFer, nDFer, nDFer * nHDia, nHInd, Max(0, nHSem - nDFer * nHDia - nHInd)}

/*/{Protheus.doc} MI9FAIXA
Faixa de utilização herdada do CTRL-003, semana a semana.
Retorna {cCodigo, cTexto, nUtilizacao}: D=Disponível (<50%) Q=Adequado A=Atenção (>=85%) S=Sobrecarregado (>100%).
Sem capacidade e com carga: sobrecarregado. Sem capacidade e sem carga: {"", "", 0}.
/*/
User Function MI9FAIXA(nHoras, nCap)
	Local nUtil := 0
	If nCap <= 0
		If nHoras > 0
			Return {"S", "Sobrecarregado", 999}
		EndIf
		Return {"", "", 0}
	EndIf
	nUtil := nHoras / nCap
	If nUtil > 1
		Return {"S", "Sobrecarregado", nUtil}
	ElseIf nUtil >= 0.85
		Return {"A", "Atenção", nUtil}
	ElseIf nUtil < 0.5
		Return {"D", "Disponível", nUtil}
	EndIf
Return {"Q", "Adequado", nUtil}

// ---------------------------------------------------------------- Operacional (RAID)

/*/{Protheus.doc} MI9SEVER
Severidade = probabilidade (1-5) x impacto (1-5): <=4 baixa, <=9 média, <=15 alta, >15 crítica. Sem P ou I: "".
/*/
User Function MI9SEVER(nProb, nImp)
	Local nS := 0
	If Empty(nProb) .Or. Empty(nImp)
		Return ""
	EndIf
	nS := nProb * nImp
	If nS <= 4
		Return "BAIXA"
	ElseIf nS <= 9
		Return "MEDIA"
	ElseIf nS <= 15
		Return "ALTA"
	EndIf
Return "CRITICA"

/*/{Protheus.doc} MI9ABERT
Item operacional em aberto (aberto, em andamento, aguardando, bloqueado).
/*/
User Function MI9ABERT(cStatus)
Return cStatus $ "1234" .And. !Empty(cStatus)

/*/{Protheus.doc} MI9VENC
Item aberto com prazo anterior a hoje.
/*/
User Function MI9VENC(cStatus, dPrazo, dHoje)
Return U_MI9ABERT(cStatus) .And. !Empty(dPrazo) .And. dPrazo < dHoje

/*/{Protheus.doc} MI9SUGST
Sugestão de status executivo (o GP decide): 3=vermelho com 3+ atividades atrasadas, risco alto/crítico aberto
ou forecast acima das horas vendidas; 2=amarelo com qualquer atraso, pendência vencida ou risco aberto; 1=verde.
aInd = {nAtrasadas, nRiscosAltos, nRiscosAbertos, nPendVencidas, nForecast, nHorasVendidas}
/*/
User Function MI9SUGST(aInd)
	Local lEstouro := aInd[6] > 0 .And. aInd[5] > aInd[6]
	If aInd[1] >= 3 .Or. aInd[2] > 0 .Or. lEstouro
		Return "3"
	EndIf
	If aInd[1] > 0 .Or. aInd[4] > 0 .Or. aInd[3] > 0
		Return "2"
	EndIf
Return "1"
