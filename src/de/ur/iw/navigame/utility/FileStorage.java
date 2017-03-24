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
            FileWriter w = new FileWriter(getPath() + name);
            w.write(contents);
            w.flush();
            w.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    public static void storeImageFile(String name, byte[] contents) {
        try {
            FileOutputStream w = new FileOutputStream(getPath() + name);
            w.write(contents);
            w.flush();
            w.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static boolean fileExists(String name) {
        return new File(getPath() + name).exists();
    }

    public static void loadFile(String name, Consumer<String> onSuccess, Consumer<Void> onFail) {
        try {
            BufferedReader reader = new BufferedReader(new FileReader(getPath() + name));
            StringBuilder b = new StringBuilder();
            String line;
            while((line = reader.readLine()) != null) {
                b.append(line).append("\n");
            }
            reader.close();
            onSuccess.accept(b.toString());
        } catch (IOException e) {
            e.printStackTrace();
            onFail.accept(null);
        }
    }

    public static String loadFileNoCallback(String name) {
        try {
            BufferedReader reader = new BufferedReader(new FileReader(getPath() + name));
            StringBuilder b = new StringBuilder();
            String line;
            while((line = reader.readLine()) != null) {
                b.append(line).append("\n");
            }
            reader.close();
            return b.toString();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    private static String getPath() {
        return sc.getRealPath("/");// + sc.getContextPath();
    }

}
