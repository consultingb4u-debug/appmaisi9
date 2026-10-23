<?php
/**
 * Configuração do envio dos formulários do site MAIS i9 (lida pelo contato.php).
 *
 * Onde colocar: na pasta ACIMA de public_html (no Gerenciador de Arquivos da Hostinger,
 * a pasta do domínio, ao lado de public_html). Assim a senha fica fora do site publicado
 * e não é apagada quando os arquivos do site forem atualizados.
 */
return [
    // Quem recebe as solicitações (pode ser mais de um, separados por vírgula).
    'para' => 'contato@maisi9.com.br',

    // Remetente: precisa ser uma caixa de e-mail que exista no domínio maisi9.com.br.
    'de' => 'contato@maisi9.com.br',
    'nome_remetente' => 'Site MAIS i9',

    // 'smtp' (recomendado: autentica na caixa de e-mail e evita cair no spam)
    // ou 'mail' (função de envio do próprio servidor da Hostinger, sem senha).
    'metodo' => 'smtp',

    'smtp' => [
        // E-mail da Hostinger: smtp.hostinger.com, porta 465.
        // Google Workspace: smtp.gmail.com, porta 465, com "senha de app".
        // Microsoft 365: smtp.office365.com, porta 587.
        'host' => 'smtp.hostinger.com',
        'porta' => 465,
        'usuario' => 'contato@maisi9.com.br',
        'senha' => 'COLOQUE-AQUI-A-SENHA-DO-EMAIL',
    ],
];
