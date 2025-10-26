# 📌 Code Snippets para WordPress

Copia cada snippet por separado en tu plugin de Code Snippets de WordPress.

---

## Snippet 1: Crear Tabla de Leads (Ejecutar UNA SOLA VEZ)

**Nombre:** `OVP - Crear tabla de leads`  
**Tipo:** PHP  
**Ubicación:** Ejecutar una vez

```php
<?php
// Crear tabla de leads ampliada
function ovp_create_leads_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ovp_leads';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        
        -- Datos básicos
        nombre varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
        ip_address varchar(100),
        user_agent text,
        
        -- ID de la sesión en la app de diagnóstico
        session_id varchar(255),
        
        -- Estado del diagnóstico
        diagnostic_completed tinyint(1) DEFAULT 0,
        diagnostic_mode varchar(50),
        diagnostic_type varchar(50),
        
        -- Resultados del diagnóstico
        diagnosis_content longtext,
        total_score int,
        score_percentage decimal(5,2),
        
        -- Engagement y métricas
        engagement_score decimal(5,2),
        questions_asked int DEFAULT 0,
        avg_response_length decimal(8,2),
        time_spent int,
        
        -- Fechas importantes
        diagnostic_start_time datetime,
        diagnostic_completed_at datetime,
        
        -- Respuestas del quiz (JSON)
        quiz_answers longtext,
        
        -- Mensajes del chat (JSON)
        chat_messages longtext,
        
        -- Metadata adicional (JSON)
        metadata longtext,
        
        -- Código de descuento generado
        discount_code varchar(100),
        
        -- Análisis de imagen
        image_analysis_text text,
        
        -- Conversión
        converted_to_chat tinyint(1) DEFAULT 0,
        
        -- Última actualización
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        PRIMARY KEY  (id),
        KEY email (email),
        KEY session_id (session_id),
        KEY diagnostic_completed (diagnostic_completed),
        KEY fecha_creacion (fecha_creacion)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // Log para verificar
    error_log('OVP: Tabla de leads creada/actualizada');
}

// Ejecutar al activar el tema o plugin
add_action('after_setup_theme', 'ovp_create_leads_table');
```

---

## Snippet 2: Registrar Endpoints REST API

**Nombre:** `OVP - Endpoints REST API`  
**Tipo:** PHP  
**Ubicación:** Ejecutar en todas partes

```php
<?php
// Registrar endpoints REST API
add_action('rest_api_init', function () {
    
    // Endpoint para GUARDAR lead inicial
    register_rest_route('ovp/v1', '/leads', array(
        'methods' => 'POST',
        'callback' => 'ovp_save_lead',
        'permission_callback' => '__return_true',
        'args' => array(
            'nombre' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    return !empty($param);
                }
            ),
            'email' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    return is_email($param);
                }
            ),
        ),
    ));
    
    // Endpoint para RECIBIR diagnóstico completo desde la app
    register_rest_route('ovp/v1', '/diagnosis-complete', array(
        'methods' => 'POST',
        'callback' => 'ovp_receive_diagnosis',
        'permission_callback' => 'ovp_verify_api_key',
    ));
    
    // Endpoint para CONSULTAR leads
    register_rest_route('ovp/v1', '/leads', array(
        'methods' => 'GET',
        'callback' => 'ovp_get_leads',
        'permission_callback' => 'ovp_check_admin_permission',
    ));
    
    // Endpoint para ver diagnóstico completo de un lead
    register_rest_route('ovp/v1', '/leads/(?P<id>\d+)/diagnosis', array(
        'methods' => 'GET',
        'callback' => 'ovp_get_lead_diagnosis',
        'permission_callback' => 'ovp_check_admin_permission',
    ));
});
```

---

## Snippet 3: Funciones de API - Guardar Lead

**Nombre:** `OVP - Guardar lead inicial`  
**Tipo:** PHP  
**Ubicación:** Ejecutar en todas partes

```php
<?php
// Función para guardar lead inicial
function ovp_save_lead($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ovp_leads';
    
    $nombre = sanitize_text_field($request['nombre']);
    $email = sanitize_email($request['email']);
    
    // Verificar si el email ya existe
    $existing = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM $table_name WHERE email = %s",
        $email
    ));
    
    if ($existing) {
        // Si ya existe, devolver el ID existente
        return array(
            'success' => true,
            'message' => 'Lead ya existe',
            'id' => $existing,
            'existing' => true,
            'data' => array(
                'nombre' => $nombre,
                'email' => $email
            )
        );
    }
    
    // Guardar datos adicionales
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $result = $wpdb->insert(
        $table_name,
        array(
            'nombre' => $nombre,
            'email' => $email,
            'ip_address' => $ip_address,
            'user_agent' => $user_agent,
        ),
        array('%s', '%s', '%s', '%s')
    );
    
    if ($result === false) {
        return new WP_Error(
            'db_error',
            'Error al guardar en la base de datos',
            array('status' => 500)
        );
    }
    
    return array(
        'success' => true,
        'message' => 'Lead guardado exitosamente',
        'id' => $wpdb->insert_id,
        'data' => array(
            'nombre' => $nombre,
            'email' => $email
        )
    );
}
```

---

## Snippet 4: Recibir Diagnóstico Completo

**Nombre:** `OVP - Recibir diagnóstico completo`  
**Tipo:** PHP  
**Ubicación:** Ejecutar en todas partes

```php
<?php
// Función para recibir diagnóstico completo desde la app
function ovp_receive_diagnosis($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ovp_leads';
    
    // Obtener datos del request
    $data = $request->get_json_params();
    
    // LOG: Datos recibidos
    error_log('OVP DEBUG: Iniciando recepción de diagnóstico');
    error_log('OVP DEBUG: Lead ID recibido: ' . ($data['leadId'] ?? 'NO ENVIADO'));
    
    // Validar que llegó el leadId
    if (empty($data['leadId'])) {
        error_log('OVP ERROR: leadId no proporcionado');
        return new WP_Error(
            'missing_lead_id',
            'leadId es requerido',
            array('status' => 400)
        );
    }
    
    // Extraer el ID numérico (quitar prefijo 'wp_')
    $lead_id = str_replace('wp_', '', $data['leadId']);
    error_log('OVP DEBUG: Lead ID procesado: ' . $lead_id);
    
    // Verificar que el lead existe
    $existing = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE id = %d",
        $lead_id
    ));
    
    if (!$existing) {
        error_log('OVP ERROR: Lead no encontrado con ID: ' . $lead_id);
        return new WP_Error(
            'lead_not_found',
            'Lead no encontrado',
            array('status' => 404)
        );
    }
    
    error_log('OVP DEBUG: Lead encontrado - Email: ' . $existing->email);
    
    // Preparar datos para actualizar - CON VALORES POR DEFECTO
    $update_data = array(
        'diagnostic_completed' => !empty($data['diagnosticCompleted']) ? 1 : 0,
        'diagnostic_mode' => sanitize_text_field($data['diagnosticMode'] ?? 'standard'),
        'diagnostic_type' => sanitize_text_field($data['diagnosticType'] ?? 'chat'),
        'diagnosis_content' => wp_kses_post($data['diagnosisContent'] ?? ''),
        'total_score' => intval($data['totalScore'] ?? 0),
        'score_percentage' => floatval($data['scorePercentage'] ?? 0),
        'engagement_score' => floatval($data['engagementScore'] ?? 0),
        'questions_asked' => intval($data['questionsAsked'] ?? 0),
        'avg_response_length' => floatval($data['avgResponseLength'] ?? 0),
        'time_spent' => intval($data['timeSpent'] ?? 0),
        'diagnostic_start_time' => sanitize_text_field($data['startTime'] ?? ''),
        'diagnostic_completed_at' => sanitize_text_field($data['completedAt'] ?? ''),
        'quiz_answers' => json_encode($data['quizAnswers'] ?? []),
        'chat_messages' => json_encode($data['chatMessages'] ?? []),
        'metadata' => json_encode($data['metadata'] ?? []),
    );
    
    // Agregar campos opcionales de metadata
    if (!empty($data['metadata']['discountCode'])) {
        $update_data['discount_code'] = sanitize_text_field($data['metadata']['discountCode']);
    }
    if (!empty($data['metadata']['imageAnalysisText'])) {
        $update_data['image_analysis_text'] = sanitize_textarea_field($data['metadata']['imageAnalysisText']);
    }
    if (!empty($data['metadata']['convertedToChat'])) {
        $update_data['converted_to_chat'] = 1;
    }
    
    error_log('OVP DEBUG: Intentando actualizar lead con ' . count($update_data) . ' campos');
    
    // Actualizar el lead
    $result = $wpdb->update(
        $table_name,
        $update_data,
        array('id' => $lead_id)
    );
    
    if ($result === false) {
        error_log('OVP ERROR: Fallo en wpdb->update');
        error_log('OVP ERROR: SQL Error: ' . $wpdb->last_error);
        error_log('OVP ERROR: Last Query: ' . $wpdb->last_query);
        
        return new WP_Error(
            'db_error',
            'Error al actualizar el lead: ' . $wpdb->last_error,
            array('status' => 500)
        );
    }
    
    error_log("OVP SUCCESS: Lead actualizado - ID={$lead_id}, Email={$existing->email}, Rows affected={$result}");
    
    return array(
        'success' => true,
        'message' => 'Diagnóstico guardado exitosamente',
        'lead_id' => $lead_id,
        'updated' => $result > 0,
    );
}
```

---

## Snippet 5: Funciones de Consulta

**Nombre:** `OVP - Funciones de consulta`  
**Tipo:** PHP  
**Ubicación:** Ejecutar en todas partes

```php
<?php
// Función para obtener todos los leads
function ovp_get_leads($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ovp_leads';
    
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 50;
    $offset = ($page - 1) * $per_page;
    
    // Filtro opcional por estado de diagnóstico
    $completed_filter = $request->get_param('completed');
    
    $where = '';
    if ($completed_filter !== null) {
        $where = $wpdb->prepare(" WHERE diagnostic_completed = %d", $completed_filter);
    }
    
    $leads = $wpdb->get_results($wpdb->prepare(
        "SELECT 
            id, nombre, email, fecha_creacion, 
            diagnostic_completed, diagnostic_type, 
            score_percentage, engagement_score,
            diagnostic_completed_at
        FROM $table_name 
        {$where}
        ORDER BY fecha_creacion DESC 
        LIMIT %d OFFSET %d",
        $per_page,
        $offset
    ));
    
    $total = $wpdb->get_var("SELECT COUNT(*) FROM $table_name {$where}");
    
    return array(
        'success' => true,
        'total' => (int)$total,
        'page' => (int)$page,
        'per_page' => (int)$per_page,
        'leads' => $leads
    );
}

// Función para obtener diagnóstico completo de un lead
function ovp_get_lead_diagnosis($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ovp_leads';
    
    $lead_id = intval($request['id']);
    
    $lead = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE id = %d",
        $lead_id
    ));
    
    if (!$lead) {
        return new WP_Error(
            'not_found',
            'Lead no encontrado',
            array('status' => 404)
        );
    }
    
    // Decodificar JSON
    $lead->quiz_answers = json_decode($lead->quiz_answers, true);
    $lead->chat_messages = json_decode($lead->chat_messages, true);
    $lead->metadata = json_decode($lead->metadata, true);
    
    return array(
        'success' => true,
        'lead' => $lead
    );
}
```

---

## Snippet 6: Seguridad y Permisos

**Nombre:** `OVP - Seguridad y permisos`  
**Tipo:** PHP  
**Ubicación:** Ejecutar en todas partes

```php
<?php
// Verificar API Key para seguridad
function ovp_verify_api_key($request) {
    $api_key = $request->get_header('X-API-Key');
    $expected_key = get_option('ovp_api_key', '');
    
    // En desarrollo, permitir sin API key
    if (defined('WP_DEBUG') && WP_DEBUG && empty($expected_key)) {
        return true;
    }
    
    return !empty($expected_key) && $api_key === $expected_key;
}

// Verificar permisos de admin
function ovp_check_admin_permission() {
    return current_user_can('manage_options');
}
```

---

## Snippet 7: Panel de Administración

**Nombre:** `OVP - Panel de administración de leads`  
**Tipo:** PHP  
**Ubicación:** Solo en admin

```php
<?php
// Añadir menú en el admin
add_action('admin_menu', 'ovp_add_leads_menu');

function ovp_add_leads_menu() {
    add_menu_page(
        'Leads OVP',
        'Leads',
        'manage_options',
        'ovp-leads',
        'ovp_leads_page',
        'dashicons-groups',
        30
    );
    
    add_submenu_page(
        'ovp-leads',
        'Configuración',
        'Configuración',
        'manage_options',
        'ovp-settings',
        'ovp_settings_page'
    );
}

// Contenido de la página de leads
function ovp_leads_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ovp_leads';
    
    $page = isset($_GET['paged']) ? (int)$_GET['paged'] : 1;
    $per_page = 20;
    $offset = ($page - 1) * $per_page;
    
    $leads = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table_name ORDER BY fecha_creacion DESC LIMIT %d OFFSET %d",
        $per_page,
        $offset
    ));
    
    $total = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
    $total_pages = ceil($total / $per_page);
    
    // Estadísticas
    $completados = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE diagnostic_completed = 1");
    $semana = $wpdb->get_var(
        "SELECT COUNT(*) FROM $table_name WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    $hoy = $wpdb->get_var(
        "SELECT COUNT(*) FROM $table_name WHERE DATE(fecha_creacion) = CURDATE()"
    );
    
    ?>
    <div class="wrap">
        <h1>📊 Leads Capturados</h1>
        
        <div class="ovp-stats" style="display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
            <div style="background: #fff; padding: 20px; border-left: 4px solid #2271b1; flex: 1; min-width: 200px;">
                <h3 style="margin: 0; color: #666;">Total Leads</h3>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0; color: #2271b1;"><?php echo $total; ?></p>
            </div>
            <div style="background: #fff; padding: 20px; border-left: 4px solid #00a32a; flex: 1; min-width: 200px;">
                <h3 style="margin: 0; color: #666;">Diagnósticos Completados</h3>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0; color: #00a32a;"><?php echo $completados; ?></p>
                <small style="color: #999;">
                    <?php echo $total > 0 ? round(($completados / $total) * 100, 1) : 0; ?>% tasa de conversión
                </small>
            </div>
            <div style="background: #fff; padding: 20px; border-left: 4px solid #f0a000; flex: 1; min-width: 200px;">
                <h3 style="margin: 0; color: #666;">Esta semana</h3>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0; color: #f0a000;"><?php echo $semana; ?></p>
            </div>
            <div style="background: #fff; padding: 20px; border-left: 4px solid #d63638; flex: 1; min-width: 200px;">
                <h3 style="margin: 0; color: #666;">Hoy</h3>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0; color: #d63638;"><?php echo $hoy; ?></p>
            </div>
        </div>
        
        <p>
            <a href="<?php echo admin_url('admin.php?page=ovp-leads&export=csv'); ?>" 
               class="button button-primary">
                📥 Exportar a CSV
            </a>
        </p>
        
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Fecha</th>
                    <th>Diagnóstico</th>
                    <th>Score</th>
                    <th>Engagement</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($leads)): ?>
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px;">
                            No hay leads registrados aún.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($leads as $lead): ?>
                        <tr>
                            <td><?php echo esc_html($lead->id); ?></td>
                            <td><strong><?php echo esc_html($lead->nombre); ?></strong></td>
                            <td>
                                <a href="mailto:<?php echo esc_attr($lead->email); ?>">
                                    <?php echo esc_html($lead->email); ?>
                                </a>
                            </td>
                            <td><?php echo date('d/m/Y H:i', strtotime($lead->fecha_creacion)); ?></td>
                            <td>
                                <?php if ($lead->diagnostic_completed): ?>
                                    <span style="color: green; font-weight: bold;">✓ Completado</span><br>
                                    <small style="color: #666;">
                                        <?php echo ucfirst($lead->diagnostic_type); ?>
                                        <?php if ($lead->diagnostic_completed_at): ?>
                                            - <?php echo date('d/m H:i', strtotime($lead->diagnostic_completed_at)); ?>
                                        <?php endif; ?>
                                    </small>
                                <?php else: ?>
                                    <span style="color: orange;">⏳ Pendiente</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($lead->score_percentage): ?>
                                    <strong><?php echo round($lead->score_percentage, 1); ?>%</strong>
                                <?php else: ?>
                                    <span style="color: #ccc;">-</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($lead->engagement_score): ?>
                                    <?php echo round($lead->engagement_score, 1); ?>
                                <?php else: ?>
                                    <span style="color: #ccc;">-</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($lead->diagnostic_completed): ?>
                                    <a href="<?php echo admin_url('admin.php?page=ovp-lead-detail&id=' . $lead->id); ?>" 
                                       class="button button-small">
                                        Ver Diagnóstico
                                    </a>
                                <?php endif; ?>
                                <a href="#" class="button button-small" 
                                   onclick="if(confirm('¿Eliminar este lead?')) { 
                                       window.location.href='<?php echo admin_url('admin.php?page=ovp-leads&delete=' . $lead->id); ?>';
                                   } return false;">
                                    Eliminar
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
        
        <?php if ($total_pages > 1): ?>
            <div class="tablenav bottom">
                <div class="tablenav-pages">
                    <?php
                    echo paginate_links(array(
                        'base' => add_query_arg('paged', '%#%'),
                        'format' => '',
                        'prev_text' => '&laquo;',
                        'next_text' => '&raquo;',
                        'total' => $total_pages,
                        'current' => $page
                    ));
                    ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
    <?php
}
```

---

## Snippet 7b: Página de Detalle del Lead

**Nombre:** `OVP - Página de detalle del lead`  
**Tipo:** PHP  
**Ubicación:** Solo en admin

```php
<?php
// Página de detalle del lead
function ovp_lead_detail_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ovp_leads';
    
    // Obtener ID del lead
    $lead_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$lead_id) {
        wp_die('ID de lead no válido');
    }
    
    // Obtener datos del lead
    $lead = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE id = %d",
        $lead_id
    ));
    
    if (!$lead) {
        wp_die('Lead no encontrado');
    }
    
    // Decodificar JSON
    $quiz_answers = !empty($lead->quiz_answers) ? json_decode($lead->quiz_answers, true) : [];
    $chat_messages = !empty($lead->chat_messages) ? json_decode($lead->chat_messages, true) : [];
    $metadata = !empty($lead->metadata) ? json_decode($lead->metadata, true) : [];
    
    ?>
    <div class="wrap">
        <h1>📋 Detalle del Lead: <?php echo esc_html($lead->name); ?></h1>
        
        <a href="<?php echo admin_url('admin.php?page=ovp-leads'); ?>" class="button" style="margin-bottom: 20px;">← Volver a la lista</a>
        
        <!-- Información General -->
        <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #2271b1;">
            <h2>👤 Información General</h2>
            <table class="form-table">
                <tr>
                    <th>Nombre:</th>
                    <td><strong><?php echo esc_html($lead->name); ?></strong></td>
                </tr>
                <tr>
                    <th>Email:</th>
                    <td><a href="mailto:<?php echo esc_attr($lead->email); ?>"><?php echo esc_html($lead->email); ?></a></td>
                </tr>
                <tr>
                    <th>Teléfono:</th>
                    <td><?php echo esc_html($lead->phone ?: 'No proporcionado'); ?></td>
                </tr>
                <tr>
                    <th>Estado:</th>
                    <td>
                        <span class="ovp-status ovp-status-<?php echo esc_attr($lead->status); ?>">
                            <?php 
                            echo $lead->status === 'completed' ? '✅ Completado' : 
                                 ($lead->status === 'pending' ? '⏳ Pendiente' : '❌ Abandonado'); 
                            ?>
                        </span>
                    </td>
                </tr>
                <tr>
                    <th>Fecha de captura:</th>
                    <td><?php echo date('d/m/Y H:i', strtotime($lead->created_at)); ?></td>
                </tr>
                <?php if ($lead->completed_at): ?>
                <tr>
                    <th>Fecha de finalización:</th>
                    <td><?php echo date('d/m/Y H:i', strtotime($lead->completed_at)); ?></td>
                </tr>
                <?php endif; ?>
            </table>
        </div>
        
        <!-- Métricas de Engagement -->
        <?php if ($lead->engagement_score || $lead->score_percentage): ?>
        <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #00a32a;">
            <h2>📊 Métricas de Engagement</h2>
            <table class="form-table">
                <?php if ($lead->score_percentage): ?>
                <tr>
                    <th>Puntuación del diagnóstico:</th>
                    <td>
                        <strong style="font-size: 1.2em; color: #2271b1;">
                            <?php echo esc_html($lead->score_percentage); ?>%
                        </strong>
                    </td>
                </tr>
                <?php endif; ?>
                <?php if ($lead->engagement_score): ?>
                <tr>
                    <th>Score de engagement:</th>
                    <td>
                        <strong style="font-size: 1.2em; color: #00a32a;">
                            <?php echo esc_html($lead->engagement_score); ?>
                        </strong>
                    </td>
                </tr>
                <?php endif; ?>
                <?php if ($lead->interaction_count): ?>
                <tr>
                    <th>Número de interacciones:</th>
                    <td><?php echo esc_html($lead->interaction_count); ?></td>
                </tr>
                <?php endif; ?>
                <?php if ($lead->time_to_complete): ?>
                <tr>
                    <th>Tiempo de completado:</th>
                    <td><?php echo esc_html($lead->time_to_complete); ?> segundos</td>
                </tr>
                <?php endif; ?>
            </table>
        </div>
        <?php endif; ?>
        
        <!-- Diagnóstico Personalizado -->
        <?php if (!empty($lead->diagnosis_content)): ?>
        <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #d63638;">
            <h2>🎯 Diagnóstico Personalizado</h2>
            <div style="background: #f6f7f7; padding: 15px; border-radius: 4px;">
                <?php echo nl2br(esc_html($lead->diagnosis_content)); ?>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Respuestas del Quiz -->
        <?php if (!empty($quiz_answers)): ?>
        <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #8c6d00;">
            <h2>✅ Respuestas del Quiz</h2>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Pregunta</th>
                        <th>Respuesta</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($quiz_answers as $qa): ?>
                    <tr>
                        <td><strong><?php echo esc_html($qa['question'] ?? 'Pregunta'); ?></strong></td>
                        <td><?php echo esc_html($qa['answer'] ?? 'N/A'); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
        
        <!-- Conversación del Chat -->
        <?php if (!empty($chat_messages)): ?>
        <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #8c6d00;">
            <h2>💬 Historial de Conversación</h2>
            <div style="max-height: 600px; overflow-y: auto; background: #f6f7f7; padding: 15px; border-radius: 4px;">
                <?php foreach ($chat_messages as $index => $msg): ?>
                    <?php 
                    $role = $msg['role'] ?? 'user';
                    $content = $msg['content'] ?? '';
                    $is_user = $role === 'user';
                    $bg_color = $is_user ? '#2271b1' : '#f0f0f0';
                    $text_color = $is_user ? '#fff' : '#000';
                    $align = $is_user ? 'right' : 'left';
                    ?>
                    <div style="margin-bottom: 15px; text-align: <?php echo $align; ?>;">
                        <div style="display: inline-block; max-width: 70%; text-align: left;">
                            <div style="background: <?php echo $bg_color; ?>; color: <?php echo $text_color; ?>; padding: 10px 15px; border-radius: 8px;">
                                <strong><?php echo $is_user ? '👤 Usuario' : '🤖 Asistente'; ?>:</strong><br>
                                <?php echo nl2br(esc_html($content)); ?>
                            </div>
                            <?php if (isset($msg['timestamp'])): ?>
                            <small style="color: #666; margin-<?php echo $is_user ? 'right' : 'left'; ?>: 10px;">
                                <?php echo date('H:i', strtotime($msg['timestamp'])); ?>
                            </small>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Metadata Adicional -->
        <?php if (!empty($metadata)): ?>
        <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #646970;">
            <h2>🔍 Información Adicional</h2>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Campo</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($metadata as $key => $value): ?>
                    <tr>
                        <td><strong><?php echo esc_html(ucfirst(str_replace('_', ' ', $key))); ?></strong></td>
                        <td><?php echo esc_html(is_array($value) ? json_encode($value) : $value); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
        
        <!-- Código de Descuento -->
        <?php if (!empty($lead->discount_code)): ?>
        <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #7e3bd0;">
            <h2>🎁 Código de Descuento</h2>
            <table class="form-table">
                <tr>
                    <th>Código:</th>
                    <td><code style="font-size: 1.2em; background: #f0f0f0; padding: 5px 10px; border-radius: 3px;"><?php echo esc_html($lead->discount_code); ?></code></td>
                </tr>
                <?php if ($lead->discount_used_at): ?>
                <tr>
                    <th>Usado el:</th>
                    <td><?php echo date('d/m/Y H:i', strtotime($lead->discount_used_at)); ?></td>
                </tr>
                <?php else: ?>
                <tr>
                    <th>Estado:</th>
                    <td><span style="color: #00a32a;">✅ Disponible</span></td>
                </tr>
                <?php endif; ?>
            </table>
        </div>
        <?php endif; ?>
        
    </div>
    <?php
}

// Registrar la página de detalle como submenú oculto
add_action('admin_menu', function() {
    add_submenu_page(
        null, // parent_slug = null hace que no aparezca en el menú
        'Detalle del Lead',
        'Detalle del Lead',
        'manage_options',
        'ovp-lead-detail',
        'ovp_lead_detail_page'
    );
}, 11); // Prioridad 11 para ejecutar después del menú principal
?>
```

---

## Snippet 8: Página de Configuración

**Nombre:** `OVP - Página de configuración`  
**Tipo:** PHP  
**Ubicación:** Solo en admin

```php
<?php
// Página de configuración
function ovp_settings_page() {
    if (isset($_POST['ovp_api_key'])) {
        update_option('ovp_api_key', sanitize_text_field($_POST['ovp_api_key']));
        echo '<div class="updated"><p>✅ Configuración guardada.</p></div>';
    }
    
    $api_key = get_option('ovp_api_key', '');
    $webhook_url = rest_url('ovp/v1/diagnosis-complete');
    ?>
    <div class="wrap">
        <h1>⚙️ Configuración OVP Leads</h1>
        
        <div style="background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #2271b1;">
            <h2 style="margin-top: 0;">🔗 URL del Webhook</h2>
            <p>Configura esta URL en tu app de diagnóstico (archivo <code>.env</code>):</p>
            <input type="text" 
                   value="<?php echo esc_attr($webhook_url); ?>" 
                   readonly 
                   style="width: 100%; padding: 10px; font-family: monospace; background: #f5f5f5;"
                   onclick="this.select();">
            <p><small>Variable en .env: <code>WORDPRESS_WEBHOOK_URL</code></small></p>
        </div>
        
        <form method="post" style="background: #fff; padding: 20px;">
            <h2>🔐 Seguridad</h2>
            <table class="form-table">
                <tr>
                    <th><label for="ovp_api_key">API Key</label></th>
                    <td>
                        <input type="text" 
                               id="ovp_api_key" 
                               name="ovp_api_key" 
                               value="<?php echo esc_attr($api_key); ?>" 
                               class="regular-text"
                               placeholder="Genera una clave segura">
                        <p class="description">
                            Clave secreta para la comunicación con la app de diagnóstico.<br>
                            <strong>Usa la misma clave en tu archivo .env:</strong> <code>WORDPRESS_API_KEY</code>
                        </p>
                        <?php if (empty($api_key)): ?>
                            <p style="color: #d63638;">
                                ⚠️ <strong>Atención:</strong> Sin API Key configurada, la sincronización está desprotegida.
                            </p>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
            <?php submit_button('Guardar Configuración'); ?>
        </form>
        
        <div style="background: #f0f6fc; padding: 20px; margin: 20px 0; border-left: 4px solid #0d6efd;">
            <h3>📚 Instrucciones de Configuración</h3>
            <ol>
                <li>Genera una API Key segura (puedes usar: <a href="https://randomkeygen.com/" target="_blank">randomkeygen.com</a>)</li>
                <li>Guarda la API Key aquí en WordPress</li>
                <li>Copia la misma API Key en tu archivo <code>.env</code> del backend de la app</li>
                <li>Copia la URL del webhook mostrada arriba también en el <code>.env</code></li>
            </ol>
            
            <h4>Ejemplo de configuración en .env:</h4>
            <pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto;">WORDPRESS_WEBHOOK_URL=<?php echo esc_html($webhook_url); ?>

WORDPRESS_API_KEY=<?php echo !empty($api_key) ? esc_html($api_key) : 'tu_clave_secreta_aqui'; ?></pre>
        </div>
    </div>
    <?php
}
```

---

## Snippet 9: Acciones del Admin (Eliminar y Exportar)

**Nombre:** `OVP - Acciones de admin`  
**Tipo:** PHP  
**Ubicación:** Solo en admin

```php
<?php
// Manejar acciones de admin
add_action('admin_init', 'ovp_handle_lead_actions');

function ovp_handle_lead_actions() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'ovp_leads';
    
    // Eliminar lead
    if (isset($_GET['page']) && $_GET['page'] === 'ovp-leads' && isset($_GET['delete'])) {
        $id = (int)$_GET['delete'];
        $wpdb->delete($table_name, array('id' => $id), array('%d'));
        wp_redirect(admin_url('admin.php?page=ovp-leads'));
        exit;
    }
    
    // Exportar CSV
    if (isset($_GET['page']) && $_GET['page'] === 'ovp-leads' && isset($_GET['export']) && $_GET['export'] === 'csv') {
        $leads = $wpdb->get_results("SELECT * FROM $table_name ORDER BY fecha_creacion DESC");
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=leads-ovp-' . date('Y-m-d') . '.csv');
        
        $output = fopen('php://output', 'w');
        
        // Encabezados
        fputcsv($output, array(
            'ID', 'Nombre', 'Email', 'Fecha Creación', 'IP',
            'Diagnóstico Completado', 'Tipo', 'Score %', 'Engagement',
            'Preguntas', 'Tiempo (seg)', 'Fecha Completado', 'Código Descuento'
        ));
        
        // Datos
        foreach ($leads as $lead) {
            fputcsv($output, array(
                $lead->id,
                $lead->nombre,
                $lead->email,
                $lead->fecha_creacion,
                $lead->ip_address,
                $lead->diagnostic_completed ? 'Sí' : 'No',
                $lead->diagnostic_type,
                $lead->score_percentage,
                $lead->engagement_score,
                $lead->questions_asked,
                $lead->time_spent,
                $lead->diagnostic_completed_at,
                $lead->discount_code
            ));
        }
        
        fclose($output);
        exit;
    }
}
```

---

## Snippet 10: Modal del Frontend (ACTUALIZADO CON leadId)

**Nombre:** `OVP - Modal de captura de leads`  
**Tipo:** PHP  
**Ubicación:** Solo en frontend

```php
<?php
add_action('wp_footer', 'ovp_add_lead_modal');

function ovp_add_lead_modal() {
    ?>
    <!-- Modal HTML -->
    <div id="leadModal" class="ovp-modal" style="display: none;">
        <div class="ovp-modal-overlay"></div>
        <div class="ovp-modal-content">
            <button class="ovp-modal-close" aria-label="Cerrar">&times;</button>
            
            <!-- Estado: Formulario -->
            <div id="formState" class="modal-state">
                <div class="ovp-modal-icon">
                    <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" fill="#9FB870" opacity="0.15"/>
                        <path d="M26 32L30 36L38 28M48 32C48 40.8366 40.8366 48 32 48C23.1634 48 16 40.8366 16 32C16 23.1634 23.1634 16 32 16C40.8366 16 48 23.1634 48 32Z" stroke="#9FB870" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                
                <h2>¡Comienza tu transformación!</h2>
                <p class="modal-subtitle">Completa tus datos para acceder a tu diagnóstico gratuito personalizado con inteligencia artificial</p>
                
                <form id="leadForm">
                    <div class="ovp-form-group">
                        <label for="ovp-nombre">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="#9FB870"/>
                                <path d="M10 12C4.47715 12 0 14.4772 0 17.5V20H20V17.5C20 14.4772 15.5228 12 10 12Z" fill="#9FB870"/>
                            </svg>
                            Nombre completo
                        </label>
                        <input 
                            type="text" 
                            id="ovp-nombre" 
                            name="nombre" 
                            placeholder="Ej: María García"
                            required
                        />
                    </div>
                    
                    <div class="ovp-form-group">
                        <label for="ovp-email">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M2 4L10 11L18 4M2 4V16H18V4H2Z" stroke="#9FB870" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Correo electrónico
                        </label>
                        <input 
                            type="email" 
                            id="ovp-email" 
                            name="email" 
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    
                    <div id="errorMessage" class="ovp-error-message" style="display: none;"></div>
                    
                    <button type="submit" id="submitBtn" class="ovp-submit-btn">
                        <span class="btn-text-full">Comenzar mi diagnóstico gratuito</span>
                        <span class="btn-text-mobile">Comenzar</span>
                        <svg class="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    
                    <p class="ovp-privacy">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1L3 3V7C3 10.5 5.5 13.5 8 15C10.5 13.5 13 10.5 13 7V3L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Tus datos están 100% protegidos. Sin compromisos ni tarjetas requeridas.</span>
                    </p>
                </form>
            </div>

            <!-- Estado: Cargando -->
            <div id="loadingState" class="modal-state" style="display: none;">
                <div class="loading-icon">
                    <svg width="64" height="64" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#e0e0e0" stroke-width="6"/>
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#9FB870" stroke-width="6" stroke-dasharray="50 150" stroke-linecap="round">
                            <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="1.5s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </div>
                <h2>Guardando tus datos...</h2>
                <p class="modal-subtitle">Estamos creando tu perfil personalizado</p>
            </div>

            <!-- Estado: Éxito -->
            <div id="successState" class="modal-state" style="display: none;">
                <div class="success-icon">
                    <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="36" fill="#9FB870" opacity="0.1"/>
                        <circle cx="40" cy="40" r="32" stroke="#9FB870" stroke-width="3"/>
                        <path d="M28 40L36 48L54 30" stroke="#9FB870" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h2>¡Perfecto!</h2>
                <p class="modal-subtitle">Redirigiendo a tu diagnóstico personalizado...</p>
            </div>
            
        </div>
    </div>

    <style>
    /* Modal Base */
    .ovp-modal {
        position: fixed;
        z-index: 999999 !important;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        display: none;
    }

    .ovp-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .ovp-modal-content {
        position: relative;
        background: #ffffff;
        margin: 60px auto;
        padding: 36px 32px;
        width: 90%;
        max-width: 440px;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        z-index: 1000000;
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(40px) scale(0.96);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .ovp-modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: #f5f5f5;
        border: none;
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        border-radius: 50%;
        font-size: 20px;
        line-height: 1;
        color: #666;
        cursor: pointer;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        padding: 0;
    }

    .ovp-modal-close:hover {
        background: #e0e0e0;
        color: #333;
        transform: rotate(90deg);
    }

    /* Estados del modal */
    .modal-state {
        text-align: center;
    }

    /* Iconos */
    .ovp-modal-icon,
    .loading-icon,
    .success-icon {
        margin: 0 auto 20px;
        animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .success-icon svg {
        animation: successPop 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes successPop {
        0% {
            opacity: 0;
            transform: scale(0.5);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }

    /* Textos */
    .ovp-modal-content h2 {
        margin: 0 0 10px;
        font-size: 24px;
        font-weight: 700;
        color: #1a1a1a;
        line-height: 1.3;
        letter-spacing: -0.3px;
    }

    .modal-subtitle {
        margin: 0 0 28px;
        font-size: 14px;
        color: #666;
        line-height: 1.5;
    }

    /* Formulario */
    .ovp-form-group {
        margin-bottom: 18px;
        text-align: left;
    }

    .ovp-form-group label {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 600;
        color: #333;
        gap: 7px;
    }

    .ovp-form-group input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e8e8e8;
        border-radius: 10px;
        font-size: 15px;
        color: #333;
        transition: all 0.2s;
        box-sizing: border-box;
        font-family: inherit;
        background: #fafafa;
    }

    .ovp-form-group input:focus {
        outline: none;
        border-color: #9FB870;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(159, 184, 112, 0.08);
    }

    .ovp-form-group input::placeholder {
        color: #aaa;
    }

    /* Mensajes de error */
    .ovp-error-message {
        background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
        border-left: 4px solid #e53e3e;
        color: #c53030;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 16px;
        font-weight: 500;
        animation: shakeX 0.4s;
    }

    @keyframes shakeX {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }

    /* Botón */
    .ovp-submit-btn {
        width: 100%;
        padding: 14px 24px;
        background: linear-gradient(135deg, #9FB870 0%, #8ba85f 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 6px 20px rgba(159, 184, 112, 0.35);
        position: relative;
        overflow: hidden;
    }

    .ovp-submit-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
    }

    .ovp-submit-btn:hover::before {
        left: 100%;
    }

    .ovp-submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(159, 184, 112, 0.45);
    }

    .ovp-submit-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .ovp-submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .btn-text-mobile {
        display: none;
    }

    .btn-arrow {
        transition: transform 0.3s;
    }

    .ovp-submit-btn:hover .btn-arrow {
        transform: translateX(4px);
    }

    /* Privacy */
    .ovp-privacy {
        margin-top: 16px;
        text-align: left;
        font-size: 12px;
        color: #999;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        line-height: 1.5;
    }

    .ovp-privacy svg {
        flex-shrink: 0;
        margin-top: 2px;
    }

    /* Responsive */
    @media (max-width: 600px) {
        .ovp-modal-content {
            margin: 20px auto;
            width: calc(100% - 40px);
            max-width: none;
            padding: 32px 24px;
        }
        
        .ovp-modal-content h2 {
            font-size: 22px;
        }

        .modal-subtitle {
            font-size: 13px;
            margin-bottom: 24px;
        }

        .btn-text-full {
            display: none;
        }

        .btn-text-mobile {
            display: inline;
        }

        .ovp-privacy {
            font-size: 11px;
        }
    }
    </style>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ Modal OVP cargado');
        
        const modal = document.getElementById('leadModal');
        const closeBtn = document.querySelector('.ovp-modal-close');
        const overlay = document.querySelector('.ovp-modal-overlay');
        const form = document.getElementById('leadForm');
        const submitBtn = document.getElementById('submitBtn');
        const errorMessage = document.getElementById('errorMessage');
        
        const formState = document.getElementById('formState');
        const loadingState = document.getElementById('loadingState');
        const successState = document.getElementById('successState');
        
        // Función para cambiar estados
        function showState(state) {
            formState.style.display = 'none';
            loadingState.style.display = 'none';
            successState.style.display = 'none';
            
            if (state === 'form') formState.style.display = 'block';
            if (state === 'loading') loadingState.style.display = 'block';
            if (state === 'success') successState.style.display = 'block';
        }
        
        // Función para abrir el modal
        function openModal(e) {
            if (e) e.preventDefault();
            console.log('🚀 Abriendo modal OVP');
            showState('form');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
        
        // Función para cerrar el modal
        function closeModal() {
            console.log('❌ Cerrando modal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            showState('form');
            form.reset();
            errorMessage.style.display = 'none';
        }
        
        // DETECTAR SOLO ELEMENTOS CON data-ovp-modal="open"
        document.addEventListener('click', function(e) {
            if (modal.contains(e.target)) return;
            
            const target = e.target;
            let element = target;
            
            for (let i = 0; i < 10; i++) {
                if (!element) break;
                
                if (element.getAttribute && element.getAttribute('data-ovp-modal') === 'open') {
                    console.log('✅ Click en elemento con data-ovp-modal="open"');
                    openModal(e);
                    break;
                }
                
                element = element.parentElement;
            }
        }, true);
        
        // Cerrar modal
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                closeModal();
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                e.stopPropagation();
                closeModal();
            });
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
        
        // Función para mostrar error
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
        
        // MANEJAR ENVÍO DEL FORMULARIO (CON leadId)
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📝 Formulario enviado');
                
                const nombre = document.getElementById('ovp-nombre')?.value.trim();
                const email = document.getElementById('ovp-email')?.value.trim();
                
                console.log('📋 Datos:', {nombre, email});
                
                // Validaciones
                if (!nombre || nombre.length < 3) {
                    showError('Por favor ingresa tu nombre completo');
                    return;
                }
                
                if (!email || !email.includes('@')) {
                    showError('Por favor ingresa un email válido');
                    return;
                }
                
                // Mostrar estado de carga
                showState('loading');
                
                try {
                    const apiUrl = '<?php echo esc_url(rest_url('ovp/v1/leads')); ?>';
                    console.log('📡 Enviando a API:', apiUrl);
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            nombre: nombre,
                            email: email
                        })
                    });
                    
                    const data = await response.json();
                    console.log('📥 Respuesta:', data);
                    
                    if (response.ok && data.success) {
                        console.log('✅ Lead guardado con ID:', data.id);
                        
                        // Mostrar éxito
                        showState('success');
                        
                        // ⭐ CONSTRUIR URL CON leadId (DINÁMICO - FUNCIONA EN LOCAL Y PRODUCCIÓN)
                        const leadId = 'wp_' + data.id;
                        
                        // Detectar si estamos en desarrollo local
                        const isLocal = window.location.hostname === 'localhost' || 
                                       window.location.hostname.includes('.local') ||
                                       window.location.hostname.includes('127.0.0.1');
                        
                        const baseUrl = isLocal 
                            ? 'http://localhost:5173/' 
                            : 'https://chat.objetivovientreplano.com/';
                        
                        const diagnosticUrl = baseUrl + 
                            '?nombre=' + encodeURIComponent(nombre) +
                            '&email=' + encodeURIComponent(email) +
                            '&leadId=' + encodeURIComponent(leadId);
                        
                        console.log('🔗 URL de redirección:', diagnosticUrl);
                        console.log('📍 Modo:', isLocal ? 'LOCAL' : 'PRODUCCIÓN');
                        
                        // Redirigir después de 1.5s
                        setTimeout(() => {
                            console.log('🚀 Redirigiendo a diagnóstico...');
                            window.location.href = diagnosticUrl;
                        }, 1500);
                        
                    } else if (data.code === 'email_exists' || data.existing) {
                        console.log('⚠️ Email ya existe, redirigiendo con ID existente');
                        showState('success');
                        
                        // ⭐ USAR ID EXISTENTE (DINÁMICO)
                        const leadId = 'wp_' + data.id;
                        
                        const isLocal = window.location.hostname === 'localhost' || 
                                       window.location.hostname.includes('.local') ||
                                       window.location.hostname.includes('127.0.0.1');
                        
                        const baseUrl = isLocal 
                            ? 'http://localhost:5173/' 
                            : 'https://chat.objetivovientreplano.com/';
                        
                        const diagnosticUrl = baseUrl + 
                            '?nombre=' + encodeURIComponent(nombre) +
                            '&email=' + encodeURIComponent(email) +
                            '&leadId=' + encodeURIComponent(leadId);
                        
                        setTimeout(() => {
                            window.location.href = diagnosticUrl;
                        }, 1500);
                    } else {
                        console.log('❌ Error en respuesta');
                        showState('form');
                        showError(data.message || 'Hubo un error. Intenta nuevamente.');
                    }
                    
                } catch (error) {
                    console.error('❌ Error de red:', error);
                    showState('form');
                    showError('Error de conexión. Verifica tu internet.');
                }
            });
        }
    });
    </script>
    <?php
}
```

---

## 🎯 Orden de Instalación

1. **Snippet 1** - Crear tabla (ejecutar primero)
2. **Snippet 2** - Endpoints REST API
3. **Snippet 3** - Guardar lead
4. **Snippet 4** - Recibir diagnóstico
5. **Snippet 5** - Funciones de consulta
6. **Snippet 6** - Seguridad
7. **Snippet 7** - Panel de admin
8. **Snippet 8** - Configuración
9. **Snippet 9** - Acciones admin
10. **Snippet 10** - Modal (tu código actual)

---

## ✅ Verificación

Después de agregar los snippets:

1. Ve a **Leads → Configuración**
2. Configura tu API Key
3. Copia la URL del webhook
4. Configura tu `.env` del backend

¡Listo para usar! 🚀

