package app.mithila.makaranda.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves the existing SPA (hash-routed, so no server-side route fallback
 * needed). Mirrors the Node serveStatic; same assets, same REST contract.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${mm.web.dir:../packages/server/web}")
  private String webDir;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String loc = webDir.endsWith("/") ? webDir : webDir + "/";
    registry.addResourceHandler("/**")
        .addResourceLocations("file:" + loc)
        .resourceChain(false);
  }
}
