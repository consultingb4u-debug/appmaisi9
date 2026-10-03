#Include "Protheus.ch"
#Include "TbiConn.ch"

/*/{Protheus.doc} MI9J010
Job diário de alertas (agendar no Schedule do SIGACFG, por exemplo às 7h, de segunda a sexta).
Calcula os alertas (U_MI9ALER), separa por destinatário (recursos citados + gestores) e envia por e-mail
só os NOVOS (chave ainda não avisada na ZMA), com um resumo dos que continuam em aberto.
- MV_MI9MAIL = .F. (padrão): só registra no console, não envia nem grava ZMA (modo de teste).
- SMTP: parâmetros padrão MV_RELSERV (servidor[:porta]), MV_RELACNT, MV_RELPSW, MV_RELAUTH, MV_RELTLS/MV_RELSSL.
Pode ser executado também pelo menu (usa a empresa/filial logada).
@param aParam {cEmpresa, cFilial} quando chamado pelo Schedule/Job
@author MAIS i9
/*/
User Function MI9J010(aParam)
	Local lJob := Select("SX2") == 0
	Local lEnvia := .F.
	Local aAle := {}
	Local aDest := {}
	Local nI := 0
	Local nJ := 0
	Local nPos := 0
	Local cGest := ""
	Local cLog := ""
	Local nEnv := 0

	If lJob
		If ValType(aParam) <> "A" .Or. Len(aParam) < 2
			ConOut("[MI9J010] Informe empresa e filial nos parâmetros do Schedule.")
			Return Nil
		EndIf
		RpcSetType(3)
		RpcSetEnv(aParam[1], aParam[2], , , "FAT")
	EndIf
	lEnvia := SuperGetMV("MV_MI9MAIL", .F., .F.)
	aAle := U_MI9ALER(Date())

	// Destinatários: {cRecurso, aIndicesDosAlertas}
	cGest := Gestores()
	For nI := 1 To Len(aAle)
		For nJ := 1 To Len(aAle[nI][6])
			AddDest(aDest, aAle[nI][6][nJ], nI)
		Next nJ
		If aAle[nI][7]
			For nJ := 1 To Len(StrTokArr(cGest, ";"))
				AddDest(aDest, StrTokArr(cGest, ";")[nJ], nI)
			Next nJ
		EndIf
	Next nI

	For nI := 1 To Len(aDest)
		nPos := Avisar(aDest[nI][1], aDest[nI][2], aAle, lEnvia)
		nEnv += nPos
	Next nI
	cLog := "[MI9J010] " + DToC(Date()) + " " + Time() + " - " + cValToChar(Len(aAle)) + " alerta(s), " + ;
		cValToChar(Len(aDest)) + " destinatário(s), " + cValToChar(nEnv) + " e-mail(s)" + IIf(lEnvia, " enviado(s).", " simulados (MV_MI9MAIL = .F.).")
	ConOut(cLog)
	If !lJob .And. !IsBlind()
		MsgInfo(cLog, "MAIS i9")
	EndIf
	If lJob
		RpcClearEnv()
	EndIf
Return Nil

Static Function AddDest(aDest, cRec, nAlerta)
	Local nPos := aScan(aDest, {|x| x[1] == cRec})
	If Empty(cRec)
		Return Nil
	EndIf
	If nPos == 0
		aAdd(aDest, {cRec, {nAlerta}})
	ElseIf aScan(aDest[nPos][2], {|x| x == nAlerta}) == 0
		aAdd(aDest[nPos][2], nAlerta)
	EndIf
Return Nil

/*/ Recursos ativos marcados como gestores, separados por ";". /*/
Static Function Gestores()
	Local cRet := ""
	Local cAli := GetNextAlias()
	DbUseArea(.T., "TOPCONN", TcGenQry(, , ChangeQuery("SELECT ZM1_COD FROM " + RetSqlName("ZM1") + ;
		" WHERE ZM1_FILIAL = '" + xFilial("ZM1") + "' AND D_E_L_E_T_ = ' ' AND ZM1_ATIVO = '1' AND ZM1_GESTOR = '1'")), cAli, .F., .T.)
	While !(cAli)->(Eof())
		cRet += IIf(Empty(cRet), "", ";") + (cAli)->ZM1_COD
		(cAli)->(DbSkip())
	EndDo
	(cAli)->(DbCloseArea())
Return cRet

/*/ Separa novos x já avisados, envia o e-mail e registra as chaves. Retorna 1 se enviou (ou simulou), 0 se nada novo. /*/
Static Function Avisar(cRec, aIdx, aAle, lEnvia)
	Local aNovos := {}
	Local nCont := 0
	Local nI := 0
	Local cNome := ""
	Local cEmail := ""
	Local cChave := ""
	Local cAssunto := ""
	Local cHtml := ""

	ZM1->(DbSetOrder(1))
	If !ZM1->(DbSeek(xFilial("ZM1") + cRec)) .Or. ZM1->ZM1_ATIVO <> "1"
		Return 0
	EndIf
	cNome := AllTrim(ZM1->ZM1_NOME)
	cEmail := AllTrim(ZM1->ZM1_EMAIL)
	ZMA->(DbSetOrder(1))
	For nI := 1 To Len(aIdx)
		cChave := PadR(aAle[aIdx[nI]][1], Len(ZMA->ZMA_CHAVE))
		If ZMA->(DbSeek(xFilial("ZMA") + cRec + cChave))
			nCont++
		Else
			aAdd(aNovos, aAle[aIdx[nI]])
		EndIf
	Next nI
	If Len(aNovos) == 0
		Return 0
	EndIf

	cAssunto := "MAIS i9 - " + cValToChar(Len(aNovos)) + " novo(s) alerta(s)" + IIf(nCont > 0, " e " + cValToChar(nCont) + " em aberto", "")
	cHtml := '<div style="font:14px/1.5 Segoe UI,Arial,sans-serif;color:#0f1f3a;max-width:640px">'
	cHtml += "<p>Olá, " + Esc(Left(cNome, At(" ", cNome + " ") - 1)) + ".</p><p><strong>Novos alertas</strong></p><ul style=" + '"padding-left:18px"' + ">"
	For nI := 1 To Len(aNovos)
		cHtml += '<li style="margin:0 0 8px"><strong>' + Esc(aNovos[nI][4]) + "</strong>" + ;
			IIf(aNovos[nI][3] == "ALTA", ' <span style="color:#c0392b">(gravidade alta)</span>', "") + ;
			'<br><span style="color:#5b6b82">' + Esc(U_MI9TPAL(aNovos[nI][2])) + " - " + Esc(aNovos[nI][5]) + "</span></li>"
	Next nI
	cHtml += "</ul>"
	If nCont > 0
		cHtml += '<p style="color:#5b6b82">Continuam em aberto: ' + cValToChar(nCont) + " alerta(s) já avisado(s). Consulte o relatório de alertas (MI9R030).</p>"
	EndIf
	cHtml += '<p style="color:#8a97a8;font-size:12px">Aviso automático da gestão de projetos MAIS i9 no Protheus.</p></div>'

	If !lEnvia
		ConOut("[MI9J010] (simulado) para " + cNome + " <" + cEmail + ">: " + cAssunto)
		Return 1
	EndIf
	If Empty(cEmail)
		ConOut("[MI9J010] " + cNome + " sem e-mail cadastrado (ZM1_EMAIL); alertas não enviados.")
		Return 0
	EndIf
	If !Enviar(cEmail, cAssunto, cHtml)
		Return 0
	EndIf
	For nI := 1 To Len(aNovos)
		RecLock("ZMA", .T.)
		ZMA->ZMA_FILIAL := xFilial("ZMA")
		ZMA->ZMA_DEST := cRec
		ZMA->ZMA_CHAVE := aNovos[nI][1]
		ZMA->ZMA_DATA := Date()
		ZMA->(MsUnlock())
	Next nI
Return 1

Static Function Esc(cTxt)
	cTxt := StrTran(cTxt, "&", "&amp;")
	cTxt := StrTran(cTxt, "<", "&lt;")
	cTxt := StrTran(cTxt, ">", "&gt;")
Return StrTran(cTxt, '"', "&quot;")

/*/ Envio SMTP com os parâmetros padrão do Protheus (MV_REL*). /*/
Static Function Enviar(cPara, cAssunto, cHtml)
	Local cServ := AllTrim(SuperGetMV("MV_RELSERV", .F., ""))
	Local cConta := AllTrim(SuperGetMV("MV_RELACNT", .F., ""))
	Local cSenha := AllTrim(SuperGetMV("MV_RELPSW", .F., ""))
	Local lAuth := SuperGetMV("MV_RELAUTH", .F., .F.)
	Local lTLS := SuperGetMV("MV_RELTLS", .F., .F.)
	Local lSSL := SuperGetMV("MV_RELSSL", .F., .F.)
	Local cDe := AllTrim(SuperGetMV("MV_RELFROM", .F., cConta))
	Local nPorta := 25
	Local nRet := 0
	Local oSrv
	Local oMsg

	If Empty(cServ)
		ConOut("[MI9J010] MV_RELSERV não configurado.")
		Return .F.
	EndIf
	If ":" $ cServ
		nPorta := Val(SubStr(cServ, At(":", cServ) + 1))
		cServ := Left(cServ, At(":", cServ) - 1)
	EndIf
	oSrv := TMailManager():New()
	oSrv:SetUseTLS(lTLS)
	oSrv:SetUseSSL(lSSL)
	nRet := oSrv:Init("", cServ, cConta, cSenha, 0, nPorta)
	If nRet == 0
		oSrv:SetSMTPTimeout(60)
		nRet := oSrv:SMTPConnect()
	EndIf
	If nRet == 0 .And. lAuth
		nRet := oSrv:SMTPAuth(cConta, cSenha)
	EndIf
	If nRet == 0
		oMsg := TMailMessage():New()
		oMsg:Clear()
		oMsg:cFrom := cDe
		oMsg:cTo := cPara
		oMsg:cSubject := cAssunto
		oMsg:cBody := cHtml
		oMsg:MsgBodyType("text/html")
		nRet := oMsg:Send(oSrv)
	EndIf
	If nRet <> 0
		ConOut("[MI9J010] Falha no envio para " + cPara + ": " + oSrv:GetErrorString(nRet))
	EndIf
	oSrv:SMTPDisconnect()
Return nRet == 0

/*/ Definição para o Schedule do Protheus (rotina sem pergunte). /*/
Static Function SchedDef()
Return {"P", "PARAMDEF", "", {}, "Alertas da gestão de projetos MAIS i9"}
