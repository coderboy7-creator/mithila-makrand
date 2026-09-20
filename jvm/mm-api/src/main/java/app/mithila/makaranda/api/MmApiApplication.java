package app.mithila.makaranda.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** The monolith entry point. One deployable; engines are isolated beans. */
@SpringBootApplication
public class MmApiApplication {
  public static void main(String[] args) {
    SpringApplication.run(MmApiApplication.class, args);
  }
}
