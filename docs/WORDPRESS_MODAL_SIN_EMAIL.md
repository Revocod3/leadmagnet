# 📋 Modal de WordPress - Versión Sin Email (Solo Nombre)

Este snippet es la versión actualizada del modal de captura de leads que **solo pide el nombre** al inicio. El email se capturará al final del flujo cuando el usuario quiera descargar el PDF.

## Instrucciones de Instalación

1. Ve a tu WordPress Admin
2. Navega a **WPCode** → **Code Snippets**
3. Edita el snippet existente "OVP - Modal de captura de leads" o crea uno nuevo
4. Reemplaza todo el código con el siguiente
5. Asegúrate de que esté configurado para ejecutarse en **Solo en frontend**

---

## Snippet: Modal de Captura (Solo Nombre)

**Nombre:** `OVP - Modal de captura de leads (Sin Email)`  
**Tipo:** PHP  
**Ubicación:** Solo en frontend

```php
<?php
add_action('wp_footer', 'ovp_add_lead_modal_name_only');

function ovp_add_lead_modal_name_only() {
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
                <p class="modal-subtitle">Ingresa tu nombre para acceder a tu diagnóstico gratuito personalizado con inteligencia artificial</p>
                
                <form id="leadForm">
                    <div class="ovp-form-group">
                        <label for="ovp-nombre">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="#9FB870"/>
                                <path d="M10 12C4.47715 12 0 14.4772 0 17.5V20H20V17.5C20 14.4772 15.5228 12 10 12Z" fill="#9FB870"/>
                            </svg>
                            ¿Cómo te llamas?
                        </label>
                        <input 
                            type="text" 
                            id="ovp-nombre" 
                            name="nombre" 
                            placeholder="Ej: María García"
                            required
                            autocomplete="name"
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
                        <span>✨ 100% gratuito • Sin email requerido • Resultados inmediatos</span>
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
                <h2>Preparando tu diagnóstico...</h2>
                <p class="modal-subtitle">Estamos creando tu experiencia personalizada</p>
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

    /* Títulos */
    h2 {
        margin: 0 0 12px;
        font-size: 26px;
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
        display: none;
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
        box-shadow: 0 4px 14px rgba(159, 184, 112, 0.3);
        position: relative;
        overflow: hidden;
    }

    .ovp-submit-btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
    }

    .ovp-submit-btn:hover::before {
        width: 300px;
        height: 300px;
    }

    .ovp-submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(159, 184, 112, 0.4);
    }

    .ovp-submit-btn:active {
        transform: translateY(0);
    }

    .btn-arrow {
        transition: transform 0.3s;
    }

    .ovp-submit-btn:hover .btn-arrow {
        transform: translateX(4px);
    }

    /* Responsive button text */
    .btn-text-mobile {
        display: none;
    }

    @media (max-width: 480px) {
        .btn-text-full {
            display: none;
        }
        .btn-text-mobile {
            display: inline;
        }
    }

    /* Privacy text */
    .ovp-privacy {
        margin-top: 16px;
        font-size: 11px;
        color: #888;
        display: flex;
        align-items: flex-start;
        gap: 6px;
        line-height: 1.4;
    }

    .ovp-privacy svg {
        flex-shrink: 0;
        margin-top: 1px;
    }

    /* Responsive */
    @media (max-width: 480px) {
        .ovp-modal-content {
            margin: 20px auto;
            padding: 28px 24px;
            width: 95%;
        }

        h2 {
            font-size: 22px;
        }

        .modal-subtitle {
            font-size: 13px;
        }
    }
    </style>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ Modal script cargado (versión sin email)');
        
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
            console.log('🚀 Abriendo modal OVP (sin email)');
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
                    console.log('🎯 Click detectado en elemento con data-ovp-modal="open"');
                    openModal(e);
                    return;
                }
                
                element = element.parentElement;
            }
        });
        
        // Cerrar con botón X
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        // Cerrar con overlay
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }
        
        // Cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
        
        // Función para mostrar errores
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
        
        // MANEJAR ENVÍO DEL FORMULARIO (SOLO CON NOMBRE)
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📝 Formulario enviado (solo nombre)');
                
                const nombre = document.getElementById('ovp-nombre')?.value.trim();
                
                console.log('📋 Datos:', {nombre});
                
                // Validaciones
                if (!nombre || nombre.length < 2) {
                    showError('Por favor ingresa tu nombre');
                    return;
                }
                
                // Mostrar estado de carga
                showState('loading');
                
                // ⭐ GUARDAR LEAD EN WORDPRESS Y REDIRIGIR CON leadId
                try {
                    const apiUrl = '<?php echo esc_url(rest_url('ovp/v1/leads')); ?>';
                    console.log('📡 Guardando lead en WordPress:', apiUrl);
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            nombre: nombre,
                            email: 'pendiente@temp.com' // Email temporal, se actualizará al final
                        })
                    });
                    
                    const data = await response.json();
                    console.log('📥 Respuesta de WordPress:', data);
                    
                    if (response.ok && data.success) {
                        console.log('✅ Lead guardado con ID:', data.id);
                        
                        // Mostrar éxito
                        showState('success');
                        
                        // ⭐ CONSTRUIR URL CON leadId (DINÁMICO - FUNCIONA EN LOCAL Y PRODUCCIÓN)
                        const leadId = 'wp_' + data.id;
                        
                        const isLocal = window.location.hostname === 'localhost' || 
                                       window.location.hostname.includes('.local') ||
                                       window.location.hostname.includes('127.0.0.1');
                        
                        const baseUrl = isLocal 
                            ? 'http://localhost:5173/' 
                            : 'https://chat.objetivovientreplano.com/';
                        
                        const diagnosticUrl = baseUrl + 
                            '?nombre=' + encodeURIComponent(nombre) +
                            '&leadId=' + encodeURIComponent(leadId);
                        
                        console.log('🔗 URL de redirección:', diagnosticUrl);
                        console.log('📍 Modo:', isLocal ? 'LOCAL' : 'PRODUCCIÓN');
                        console.log('🏷️ Lead ID:', leadId);
                        
                        // Redirigir después de 1.5s
                        setTimeout(() => {
                            console.log('🚀 Redirigiendo a diagnóstico...');
                            window.location.href = diagnosticUrl;
                        }, 1500);
                        
                    } else if (data.code === 'email_exists' || data.existing) {
                        // Si ya existe (por el email temporal), usar el ID existente
                        console.log('⚠️ Lead ya existe, usando ID existente');
                        showState('success');
                        
                        const leadId = 'wp_' + data.id;
                        
                        const isLocal = window.location.hostname === 'localhost' || 
                                       window.location.hostname.includes('.local') ||
                                       window.location.hostname.includes('127.0.0.1');
                        
                        const baseUrl = isLocal 
                            ? 'http://localhost:5173/' 
                            : 'https://chat.objetivovientreplano.com/';
                        
                        const diagnosticUrl = baseUrl + 
                            '?nombre=' + encodeURIComponent(nombre) +
                            '&leadId=' + encodeURIComponent(leadId);
                        
                        setTimeout(() => {
                            window.location.href = diagnosticUrl;
                        }, 1500);
                    } else {
                        console.error('❌ Error en respuesta de WordPress');
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

## Cambios Principales

### 1. **Formulario simplificado**
- ✅ Solo pide **nombre** al inicio
- ❌ Ya no pide email en el modal inicial
- El email se capturará cuando el usuario quiera descargar el PDF

### 2. **URL de redirección actualizada**
```javascript
// AHORA (con nombre Y leadId):
const diagnosticUrl = baseUrl + 
    '?nombre=' + encodeURIComponent(nombre) +
    '&leadId=' + encodeURIComponent(leadId);  // ← AGREGADO leadId
```

**Flujo actualizado:**
1. Modal pide solo nombre
2. Se guarda lead en WordPress con email temporal: `pendiente@temp.com`
3. WordPress devuelve el ID del lead
4. Se redirige al chat con `?nombre=Juan&leadId=wp_123`
5. Al finalizar diagnóstico y pedir email, se actualiza el lead en WordPress con el email real

### 3. **Mensaje actualizado**
```html
<!-- ANTES -->
<p class="modal-subtitle">Completa tus datos para acceder...</p>

<!-- AHORA -->
<p class="modal-subtitle">Ingresa tu nombre para acceder...</p>

<!-- Privacy note actualizado -->
<p class="ovp-privacy">
    ✨ 100% gratuito • Sin email requerido • Resultados inmediatos
</p>
```

### 4. **Validación simplificada**
```javascript
// Solo validar nombre
if (!nombre || nombre.length < 2) {
    showError('Por favor ingresa tu nombre');
    return;
}
```

---

## Flujo Completo del Usuario

1. **WordPress**: Usuario ingresa su **nombre** en el modal
2. **Redirección**: Se redirige al chat con `?nombre=Juan`
3. **Chat**: Usuario completa el diagnóstico sin proporcionar email
4. **Al finalizar**: Cuando quiere descargar el PDF, aparece un modal pidiendo su email
5. **Email capturado**: El email se guarda en la sesión y en WordPress (si se integra)
6. **PDF descargado**: Usuario recibe su diagnóstico

---

## Ventajas de Este Enfoque

✅ **Menos fricción**: Solo nombre al inicio  
✅ **Mayor conversión**: Menos campos = más usuarios que comienzan  
✅ **Email cuando importa**: Se pide cuando el usuario ya ve el valor (diagnóstico completo)  
✅ **Mejor UX**: Flujo más natural y menos invasivo  
✅ **Mantiene leads**: Podemos trackear el usuario por nombre aunque no descargue el PDF

---

## Notas Importantes

- El frontend ya está preparado para recibir solo el nombre
- El backend ya acepta sesiones sin email
- El modal de captura de email al final ya está implementado
- WordPress puede guardar el lead inicial solo con nombre, y actualizarlo con el email después

