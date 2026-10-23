<?php
/**
 * MAIS i9: recebe os formulários do site (consultoria, demonstração do WMS e contato)
 * e envia cada solicitação por e-mail para a equipe comercial.
 *
 * Configuração em contato-config.php, procurado na pasta acima de public_html (recomendado)
 * ou ao lado deste arquivo. Sem configuração, envia com a função mail() do servidor para o
 * e-mail comercial do site.
 *
 * Responde JSON ({status, ...}) para o site; sem JavaScript, devolve uma página simples.
 */

declare(strict_types=1);

const TEMPO_MINIMO_MS = 2500;       // envios mais rápidos que isso são de robôs
const ENVIOS_POR_JANELA = 5;        // por endereço IP
const JANELA_SEGUNDOS = 600;

date_default_timezone_set('America/Sao_Paulo');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$querJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    responder(['status' => 'falha', 'mensagem' => 'Use o formulário do site para enviar sua mensagem.'], 405);
}

$definicoes = lerDefinicoes();
$config = lerConfig($definicoes);
if ($config === null) {
    responder(['status' => 'nao-configurado'], 503);
}

$entrada = [];
foreach ($_POST as $chave => $valor) {
    if (is_string($chave) && is_string($valor)) $entrada[$chave] = trim($valor);
}

$tipo = $entrada['tipo'] ?? '';
if (!isset($definicoes['tipos'][$tipo])) {
    responder(['status' => 'falha', 'mensagem' => 'Formulário inválido. Recarregue a página e tente novamente.'], 400);
}

[$dados, $erros] = validar($tipo, $entrada, $definicoes);
if ($erros) {
    responder(['status' => 'invalido', 'erros' => $erros], 422);
}

// Armadilhas para robôs: campo invisível preenchido ou envio rápido demais.
$inicio = (int) ($entrada['inicio'] ?? 0);
if (($entrada['website'] ?? '') !== '' || ($inicio > 0 && (int) (microtime(true) * 1000) - $inicio < TEMPO_MINIMO_MS)) {
    responder(['status' => 'falha', 'mensagem' => 'Não foi possível enviar agora. Aguarde alguns segundos e tente novamente.'], 400);
}

if (!permitirEnvio($_SERVER['REMOTE_ADDR'] ?? 'desconhecido', (string) ($config['pasta_limite'] ?? sys_get_temp_dir() . '/maisi9-contato'))) {
    responder(['status' => 'falha', 'mensagem' => 'Recebemos muitos envios a partir da sua conexão. Tente novamente em alguns minutos.'], 429);
}

$protocolo = strtoupper(bin2hex(random_bytes(4)));
[$assunto, $corpo] = montarEmail($tipo, $dados, lerOrigem($entrada), $protocolo, $definicoes);

try {
    enviarEmail($config, $assunto, $corpo, $dados['email'], $dados['nome']);
} catch (Throwable $e) {
    error_log('[contato.php] ' . $protocolo . ': ' . $e->getMessage());
    responder(['status' => 'falha', 'mensagem' => 'Não conseguimos enviar sua mensagem agora. Tente novamente em alguns minutos.'], 502);
}

responder(['status' => 'enviado', 'protocolo' => $protocolo]);


/* ------------------------------------------------------------------ */

/** Rótulos e opções gerados no build do site (contato-opcoes.json). */
function lerDefinicoes(): array
{
    $json = @file_get_contents(__DIR__ . '/contato-opcoes.json');
    $definicoes = $json ? json_decode($json, true) : null;
    if (!is_array($definicoes) || empty($definicoes['tipos'])) {
        error_log('[contato.php] contato-opcoes.json ausente ou inválido');
        responder(['status' => 'nao-configurado'], 503);
    }
    return $definicoes;
}

function lerConfig(array $definicoes): ?array
{
    $config = null;
    foreach ([dirname(__DIR__) . '/contato-config.php', __DIR__ . '/contato-config.php'] as $arquivo) {
        if (@is_file($arquivo)) {
            $config = require $arquivo;
            break;
        }
    }
    $config = is_array($config) ? $config : [];
    $padrao = $definicoes['emailComercial'] ?? '';
    $config['para'] = $config['para'] ?? $padrao;
    $config['de'] = $config['de'] ?? $padrao;
    $config['nome_remetente'] = $config['nome_remetente'] ?? 'Site MAIS i9';
    $config['metodo'] = $config['metodo'] ?? 'mail';
    // SMTP sem senha preenchida: usa a função de envio do servidor em vez de falhar.
    $senha = (string) ($config['smtp']['senha'] ?? '');
    if ($config['metodo'] === 'smtp' && ($senha === '' || str_starts_with($senha, 'COLOQUE'))) {
        error_log('[contato.php] senha SMTP não preenchida em contato-config.php; enviando com mail()');
        $config['metodo'] = 'mail';
    }
    if (!$config['para'] || !filter_var($config['de'], FILTER_VALIDATE_EMAIL)) return null;
    return $config;
}

/** Mesmas regras do site (lib/leads/esquemas.ts). Devolve [dados normalizados, erros por campo]. */
function validar(string $tipo, array $e, array $definicoes): array
{
    $erros = [];
    $dados = [];
    $texto = static fn(string $c): string => (string) ($e[$c] ?? '');

    $nome = umaLinha($texto('nome'));
    if (tamanho($nome) < 2) $erros['nome'] = 'Informe seu nome.';
    elseif (tamanho($nome) > 120) $erros['nome'] = 'Use até 120 caracteres.';
    $dados['nome'] = $nome;

    $empresa = umaLinha($texto('empresa'));
    if (tamanho($empresa) < 2) $erros['empresa'] = 'Informe o nome da empresa.';
    elseif (tamanho($empresa) > 160) $erros['empresa'] = 'Use até 160 caracteres.';
    $dados['empresa'] = $empresa;

    $email = strtolower(umaLinha($texto('email')));
    if ($email === '') $erros['email'] = 'Informe seu e-mail corporativo.';
    elseif (tamanho($email) > 160) $erros['email'] = 'Use até 160 caracteres.';
    elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $erros['email'] = 'Informe um e-mail válido.';
    $dados['email'] = $email;

    $telefone = $texto('telefone');
    $telefoneObrigatorio = $tipo !== 'contato';
    if ($telefone === '' && !$telefoneObrigatorio) {
        $dados['telefone'] = null;
    } elseif (tamanho($telefone) > 30 || !telefoneValido($telefone)) {
        $erros['telefone'] = 'Informe um telefone válido com DDD.';
    } else {
        $dados['telefone'] = formatarTelefone($telefone);
    }

    $opcao = static function (string $campo, string $mensagem) use ($e, $tipo, $definicoes, &$erros, &$dados): void {
        $valor = (string) ($e[$campo] ?? '');
        if (rotuloOpcao($definicoes, $tipo, $campo, $valor) === null) $erros[$campo] = $mensagem;
        $dados[$campo] = $valor;
    };
    $livre = static function (string $campo, int $min, string $vazio, string $curto) use ($e, &$erros, &$dados): void {
        $valor = (string) ($e[$campo] ?? '');
        if ($min > 0 && $valor === '') $erros[$campo] = $vazio;
        elseif ($valor !== '' && tamanho($valor) < $min) $erros[$campo] = $curto;
        elseif (tamanho($valor) > 3000) $erros[$campo] = 'Use até 3.000 caracteres.';
        $dados[$campo] = $valor === '' ? null : $valor;
    };

    switch ($tipo) {
        case 'consultoria':
            $opcao('servico', 'Selecione o serviço de interesse.');
            $livre('mensagem', 0, '', '');
            break;
        case 'demonstracao-wms':
            $opcao('erp', 'Selecione o ERP utilizado.');
            $erpOutro = umaLinha($texto('erpOutro'));
            if ($erpOutro !== '' && tamanho($erpOutro) > 80) $erros['erpOutro'] = 'Use até 80 caracteres.';
            elseif (($dados['erp'] ?? '') === 'outro' && $erpOutro === '') $erros['erpOutro'] = 'Informe qual ERP.';
            $dados['erpOutro'] = $erpOutro === '' ? null : $erpOutro;
            $opcao('usuarios', 'Selecione a quantidade aproximada de usuários.');
            $livre('desafio', 5, 'Conte qual é o principal desafio logístico.', 'Conte qual é o principal desafio logístico.');
            break;
        case 'contato':
            $opcao('assunto', 'Selecione o assunto.');
            $livre('mensagem', 10, 'Escreva sua mensagem.', 'Escreva uma mensagem com pelo menos 10 caracteres.');
            break;
    }

    if (($e['consentimento'] ?? '') !== 'on') {
        $erros['consentimento'] = 'Para enviarmos o retorno, é preciso concordar com o tratamento dos dados.';
    }
    $dados['aceitaComunicacoes'] = ($e['aceitaComunicacoes'] ?? '') === 'on';

    return [$dados, $erros];
}

function rotuloOpcao(array $definicoes, string $tipo, string $campo, string $valor): ?string
{
    foreach ($definicoes['campos'][$tipo] ?? [] as $definicao) {
        if (($definicao['chave'] ?? '') !== $campo) continue;
        foreach ($definicao['opcoes'] ?? [] as $opcao) {
            if (($opcao['valor'] ?? null) === $valor) return (string) $opcao['rotulo'];
        }
    }
    return null;
}

/* Telefone brasileiro com DDD (mesma regra de lib/telefone.ts). */
function digitosTelefone(string $valor): string
{
    $d = ltrim(preg_replace('/\D/', '', $valor) ?? '', '0');
    return strlen($d) > 11 && str_starts_with($d, '55') ? substr($d, 2) : $d;
}

function telefoneValido(string $valor): bool
{
    $d = digitosTelefone($valor);
    if (strlen($d) === 10) return (bool) preg_match('/^[1-9]{2}[2-8]/', $d);
    if (strlen($d) === 11) return (bool) preg_match('/^[1-9]{2}9/', $d);
    return false;
}

function formatarTelefone(string $valor): string
{
    $d = digitosTelefone($valor);
    $corte = strlen($d) === 11 ? 5 : 4;
    return sprintf('(%s) %s-%s', substr($d, 0, 2), substr($d, 2, $corte), substr($d, 2 + $corte));
}

function lerOrigem(array $e): array
{
    $curto = static fn(string $c, int $max): ?string => ($v = umaLinha((string) ($e[$c] ?? ''))) === '' ? null : cortar($v, $max);
    $pagina = $curto('origemPagina', 300);
    $utm = [];
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as $chave) {
        if (($v = $curto($chave, 150)) !== null) $utm[$chave] = $v;
    }
    return [
        'pagina' => $pagina !== null && str_starts_with($pagina, '/') ? $pagina : null,
        'referencia' => $curto('origemReferencia', 500),
        'utm' => $utm,
    ];
}

function montarEmail(string $tipo, array $d, array $origem, string $protocolo, array $definicoes): array
{
    $tipoRotulo = (string) $definicoes['tipos'][$tipo];
    $dominio = substr((string) strrchr($d['email'], '@'), 1);
    $gratuito = in_array($dominio, ['gmail.com', 'hotmail.com', 'outlook.com', 'live.com', 'yahoo.com', 'yahoo.com.br',
        'bol.com.br', 'uol.com.br', 'terra.com.br', 'icloud.com', 'proton.me'], true);

    $linhas = [
        $tipoRotulo . ', recebido pelo site em ' . date('d/m/Y, H:i:s'),
        'Protocolo: ' . $protocolo,
        '',
        'Nome: ' . $d['nome'],
        'Empresa: ' . $d['empresa'],
        'E-mail: ' . $d['email'] . ($gratuito ? ' (provedor gratuito)' : ''),
        'Telefone: ' . ($d['telefone'] ?? 'não informado'),
    ];
    $mensagem = null;
    foreach ($definicoes['campos'][$tipo] ?? [] as $campo) {
        $chave = $campo['chave'];
        $valor = $d[$chave] ?? null;
        if ($valor === null || $valor === '') continue;
        if ($chave === 'mensagem') { $mensagem = $valor; continue; }
        $linhas[] = $campo['rotulo'] . ': ' . (rotuloOpcao($definicoes, $tipo, $chave, $valor) ?? $valor);
    }
    $mensagem ??= $d['mensagem'] ?? null;
    if ($mensagem) array_push($linhas, '', 'Mensagem:', $mensagem);
    array_push(
        $linhas,
        '',
        'Consentimento LGPD: sim (política ' . ($definicoes['versaoPolitica'] ?? '') . ')',
        'Aceita comunicações: ' . ($d['aceitaComunicacoes'] ? 'sim' : 'não'),
        'Página de origem: ' . ($origem['pagina'] ?? 'não informada'),
    );
    if ($origem['utm']) {
        $linhas[] = 'UTM: ' . implode(' · ', array_map(fn($k, $v) => "$k=$v", array_keys($origem['utm']), $origem['utm']));
    }
    if ($origem['referencia']) $linhas[] = 'Referência: ' . $origem['referencia'];

    $assunto = '[Site MAIS i9] ' . $tipoRotulo . ': ' . $d['empresa'] . ' (' . $d['nome'] . ') · ' . $protocolo;
    return [$assunto, implode("\n", $linhas)];
}

/* ------------------------------------------------------------------ */
/* Envio                                                               */

function enviarEmail(array $config, string $assunto, string $corpo, string $emailVisitante, string $nomeVisitante): void
{
    $para = array_values(array_filter(array_map('trim', is_array($config['para']) ? $config['para'] : explode(',', (string) $config['para']))));
    $de = (string) $config['de'];
    $cabecalhos = [
        'From' => cabecalhoEndereco((string) $config['nome_remetente'], $de),
        'Reply-To' => cabecalhoEndereco($nomeVisitante, $emailVisitante),
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => 'base64',
        'X-Mailer' => 'MAIS i9 site',
    ];
    $corpoCodificado = rtrim(chunk_split(base64_encode(str_replace("\n", "\r\n", $corpo)), 76, "\r\n"));
    $assuntoCodificado = codificarCabecalho($assunto);

    switch ($config['metodo']) {
        case 'smtp':
            $smtp = $config['smtp'] ?? [];
            if (empty($smtp['host'])) throw new RuntimeException('SMTP sem host configurado');
            $dominio = substr((string) strrchr($de, '@'), 1) ?: 'localhost';
            $mensagem = implode("\r\n", array_merge(
                [
                    'Date: ' . date(DATE_RFC2822),
                    'To: ' . implode(', ', $para),
                    'Subject: ' . $assuntoCodificado,
                    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $dominio . '>',
                ],
                array_map(fn($k, $v) => "$k: $v", array_keys($cabecalhos), $cabecalhos),
            )) . "\r\n\r\n" . $corpoCodificado;
            enviarSmtp($smtp, $de, $para, $mensagem);
            return;

        case 'arquivo':
            // Só para testes: grava o e-mail em vez de enviar.
            $pasta = (string) ($config['pasta_arquivo'] ?? sys_get_temp_dir());
            $conteudo = "To: " . implode(', ', $para) . "\r\nSubject: $assuntoCodificado\r\n"
                . implode("\r\n", array_map(fn($k, $v) => "$k: $v", array_keys($cabecalhos), $cabecalhos))
                . "\r\n\r\n" . $corpoCodificado;
            if (@file_put_contents($pasta . '/contato-' . microtime(true) . '.eml', $conteudo) === false) {
                throw new RuntimeException('Não foi possível gravar o e-mail de teste');
            }
            return;

        default:
            $linhas = implode("\r\n", array_map(fn($k, $v) => "$k: $v", array_keys($cabecalhos), $cabecalhos));
            // "-f" define o remetente do envelope (ajuda na entrega: SPF do domínio).
            if (!mail(implode(', ', $para), $assuntoCodificado, $corpoCodificado, $linhas, '-f' . $de)) {
                throw new RuntimeException('mail() recusou o envio');
            }
    }
}

/** Cliente SMTP mínimo (SSL na 465 ou STARTTLS na 587), com AUTH LOGIN. */
function enviarSmtp(array $smtp, string $de, array $para, string $mensagem): void
{
    $porta = (int) ($smtp['porta'] ?? 465);
    $seguranca = (string) ($smtp['seguranca'] ?? ($porta === 465 ? 'ssl' : 'tls'));
    $alvo = ($seguranca === 'ssl' ? 'ssl://' : 'tcp://') . $smtp['host'] . ':' . $porta;
    $conexao = @stream_socket_client($alvo, $codigo, $erro, 20, STREAM_CLIENT_CONNECT, stream_context_create());
    if (!$conexao) throw new RuntimeException("SMTP: não conectou em $alvo ($erro)");
    stream_set_timeout($conexao, 20);

    $comando = static function (?string $linha, array $esperado) use ($conexao): string {
        if ($linha !== null) fwrite($conexao, $linha . "\r\n");
        $resposta = '';
        while (($parte = fgets($conexao, 1024)) !== false) {
            $resposta .= $parte;
            if (strlen($parte) < 4 || $parte[3] === ' ') break;
        }
        if (!in_array((int) substr($resposta, 0, 3), $esperado, true)) {
            throw new RuntimeException('SMTP: ' . trim($resposta ?: 'sem resposta'));
        }
        return $resposta;
    };

    $comando(null, [220]);
    $ehlo = 'EHLO ' . (gethostname() ?: 'localhost');
    $comando($ehlo, [250]);
    if ($seguranca === 'tls') {
        $comando('STARTTLS', [220]);
        if (!stream_socket_enable_crypto($conexao, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new RuntimeException('SMTP: falha no STARTTLS');
        }
        $comando($ehlo, [250]);
    }
    if (!empty($smtp['usuario'])) {
        $comando('AUTH LOGIN', [334]);
        $comando(base64_encode((string) $smtp['usuario']), [334]);
        $comando(base64_encode((string) ($smtp['senha'] ?? '')), [235]);
    }
    $comando("MAIL FROM:<$de>", [250]);
    foreach ($para as $destino) $comando("RCPT TO:<$destino>", [250, 251]);
    $comando('DATA', [354]);
    $comando(preg_replace('/^\./m', '..', $mensagem) . "\r\n.", [250]);
    $comando('QUIT', [221]);
    fclose($conexao);
}

/* ------------------------------------------------------------------ */
/* Apoio                                                               */

/** Até 5 envios a cada 10 minutos por IP (arquivos na pasta temporária do servidor). */
function permitirEnvio(string $ip, string $pasta): bool
{
    if (!is_dir($pasta) && !@mkdir($pasta, 0700, true) && !is_dir($pasta)) return true;
    $arquivo = $pasta . '/' . hash('sha256', $ip);
    $f = @fopen($arquivo, 'c+');
    if (!$f) return true;
    flock($f, LOCK_EX);
    $agora = time();
    $envios = array_filter(json_decode(stream_get_contents($f) ?: '[]', true) ?: [], fn($t) => is_int($t) && $agora - $t < JANELA_SEGUNDOS);
    $permitido = count($envios) < ENVIOS_POR_JANELA;
    if ($permitido) $envios[] = $agora;
    ftruncate($f, 0);
    rewind($f);
    fwrite($f, json_encode(array_values($envios)));
    flock($f, LOCK_UN);
    fclose($f);
    return $permitido;
}

/** Remove quebras de linha e caracteres de controle (impede injeção de cabeçalhos). */
function umaLinha(string $valor): string
{
    return trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $valor) ?? '');
}

function tamanho(string $valor): int
{
    return function_exists('mb_strlen') ? mb_strlen($valor, 'UTF-8') : strlen($valor);
}

function cortar(string $valor, int $maximo): string
{
    return function_exists('mb_substr') ? mb_substr($valor, 0, $maximo, 'UTF-8') : substr($valor, 0, $maximo);
}

function codificarCabecalho(string $texto): string
{
    return preg_match('/[^\x20-\x7E]/', $texto) ? '=?UTF-8?B?' . base64_encode($texto) . '?=' : $texto;
}

function cabecalhoEndereco(string $nome, string $email): string
{
    $nome = str_replace(['"', '\\'], '', umaLinha($nome));
    return ($nome === '' ? '' : codificarCabecalho($nome) . ' ') . '<' . umaLinha($email) . '>';
}

function responder(array $estado, int $http = 200): never
{
    global $querJson;
    http_response_code($http);
    if ($querJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($estado, JSON_UNESCAPED_UNICODE);
        exit;
    }
    // Sem JavaScript: página simples com o resultado.
    header('Content-Type: text/html; charset=utf-8');
    $voltar = '<p><a href="javascript:history.back()">Voltar ao formulário</a> · <a href="/">Página inicial</a></p>';
    $titulo = 'Não foi possível enviar';
    $texto = htmlspecialchars((string) ($estado['mensagem'] ?? 'Revise os dados e tente novamente.'));
    if ($estado['status'] === 'enviado') {
        $titulo = 'Recebemos sua solicitação';
        $texto = 'Obrigado! Um especialista da MAIS i9 retorna em breve. Protocolo: <strong>' . htmlspecialchars($estado['protocolo']) . '</strong>';
        $voltar = '<p><a href="/">Voltar ao site</a></p>';
    } elseif ($estado['status'] === 'invalido') {
        $texto = 'Revise os campos:</p><ul><li>' . implode('</li><li>', array_map('htmlspecialchars', $estado['erros'])) . '</li></ul><p>';
    } elseif ($estado['status'] === 'nao-configurado') {
        $texto = 'O envio de formulários não está disponível no momento. Sua mensagem não foi enviada.';
    }
    echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . $titulo . ' | MAIS i9</title>'
        . '<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#0a1a30;line-height:1.6}a{color:#1f5f9e}</style>'
        . '</head><body><h1>' . $titulo . '</h1><p>' . $texto . '</p>' . $voltar . '</body></html>';
    exit;
}
