package de.ur.iw.navigame.utility;

import javax.servlet.ServletContext;
import java.io.*;
import java.util.function.Consumer;

public class FileStorage {

    private static ServletContext sc;

    public static void setServletContext(ServletContext context) {
        sc = context;
    }

    public static void storeFile(String name, String contents) {
        try {
            FileWriter w = new FileWriter(sc.getRealPath("/") + name);
            w.write(contents);
            w.flush();
            w.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static boolean fileExists(String name) {
        return new File(sc.getRealPath("/") + name).exists();
    }

    public static void loadFile(String name, Consumer<String> onSuccess, Consumer<Void> onFail) {
        try {
            BufferedReader reader = new BufferedReader(new FileReader(sc.getRealPath("/") + name));
            StringBuilder b = new StringBuilder();
            String line;
            while((line = reader.readLine()) != null) {
                b.append(line).append("\n");
            }
            onSuccess.accept(b.toString());
        } catch (IOException e) {
            e.printStackTrace();
            onFail.accept(null);
        }
    }

}
